/**
 * EngramSessionStore — Engram-backed {@link SessionStore} implementation.
 *
 * Maps the domain-agnostic memory model (MemoryRecord / SaveMemoryInput /
 * MemoryScope) onto company-scoped engram observations:
 *
 * | Memory field                 | Engram field                          |
 * |------------------------------|---------------------------------------|
 * | record.metadata.tenantId     | scope.organizationId                  |
 * | record.metadata.ruc          | scope.ruc (+ scope.companyId = ruc)   |
 * | record.metadata.period       | scope.period ("" when absent)         |
 * | record.content (string)      | content.what                          |
 * | record.type                  | observation type + title              |
 * | record.sessionId / agent+type| topicKey (upsert chain identity)      |
 * | record.agentId               | provenance.actor                      |
 * | record.metadata.sessionId    | provenance.session                    |
 *
 * On reads the scope is reconstructed from `MemoryScope` (scope.tenantId →
 * organizationId, scope.metadata.ruc → ruc, scope.metadata.period → period)
 * so records returned by this store round-trip into new queries.
 *
 * No monetary fields exist in this module; Drenyra money values are BigInt
 * cents (repo-wide rule) and nothing here touches them.
 *
 * @module @drenyra/memory/engram-session-store
 */

import type {
	EngramClient,
	EngramObservation,
	EngramReadParams,
} from "./engram-client.js";
import { EngramError } from "./engram-client.js";
import type { SessionStore } from "./session-store.js";
import type {
	MemoryContext,
	MemoryContextQuery,
	MemoryRecord,
	MemoryScope,
	MemorySearchQuery,
	MemorySearchResult,
	SaveMemoryInput,
} from "./types.js";

/** Options for {@link EngramSessionStore}. */
export interface EngramSessionStoreOptions {
	/**
	 * Producer identity recorded in every observation's provenance.source.
	 * @default "drenyra-memory"
	 */
	source?: string;
}

/**
 * Engram-backed implementation of {@link SessionStore}.
 *
 * All writes go to POST /v1/observations (upsert by topicKey + exact scope);
 * reads go to GET /v1/search and GET /v1/context. Company-scoped operations
 * require `metadata.ruc` (11 digits) — the engine rejects anything else.
 *
 * @example
 * ```ts
 * const store = new EngramSessionStore(new EngramClient(engramConfig()));
 * await store.save({
 *   agentId: "analysis",
 *   sessionId: "sess-1",
 *   scope: { tenantId: "tenant-1" },
 *   type: "fact",
 *   content: "Analysis complete",
 *   metadata: { ruc: "20123456789", tenantId: "tenant-1" },
 * });
 * ```
 */
export class EngramSessionStore implements SessionStore {
	private readonly source: string;

	constructor(
		private readonly client: EngramClient,
		options: EngramSessionStoreOptions = {},
	) {
		this.source = options.source ?? "drenyra-memory";
	}

	async save(input: SaveMemoryInput): Promise<MemoryRecord> {
		const ruc = readMetadataString(input.metadata, "ruc");
		if (ruc === undefined) {
			throw new EngramError("invalid-input", {
				code: "INVALID_SCOPE",
				message:
					"SaveMemoryInput.metadata.ruc (11-digit RUC) is required for company-scoped engram observations",
			});
		}

		const tenantId = readMetadataString(input.metadata, "tenantId");
		const period = readMetadataString(input.metadata, "period") ?? "";

		const scope = buildSaveScope(ruc, period, tenantId);
		const source = buildSaveSource(input, this.source);
		const topicKey = input.sessionId ?? `memory:${input.agentId}:${input.type}`;

		const result = await this.client.save({
			topicKey,
			title: input.type,
			kind: "fact",
			scope,
			fiscalEffect: "none",
			// The engine requires ALL four content fields non-empty
			// (AssertValidContent fails closed). why/where/learned carry the
			// record's provenance-shaped context; learned embeds the full
			// record as JSON so it is searchable AND exactly reconstructable.
			content: {
				what: input.content,
				why: "agent memory record",
				where: this.source,
				learned: JSON.stringify({
					agentId: input.agentId,
					sessionId: input.sessionId,
					type: input.type,
					metadata: input.metadata,
				}),
			},
			source,
		});

		return recordFromSaveInput(input, result.observation);
	}

	async search(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
		const params = readParamsFromScope(query.scope);
		const results = await this.client.search({
			...params,
			q: query.text,
		});

		return results.map((result) => ({
			record: recordFromObservation(result.observation),
			score: result.score,
		}));
	}

	async context(query: MemoryContextQuery): Promise<MemoryContext> {
		const params = readParamsFromScope(query.scope);
		const observations = await this.client.context(params);

		const records = observations
			.map(recordFromObservation)
			.slice(0, query.limit ?? 10);

		return {
			records,
			summary: condense(records),
		};
	}

	async getBySession(
		sessionId: string,
		scope: MemoryScope,
	): Promise<MemoryRecord[]> {
		const params = readParamsFromScope(scope);
		const observations = await this.client.context(params);

		return observations
			.filter(
				(observation) =>
					observation.source.session !== undefined &&
					observation.source.session === sessionId,
			)
			.map(recordFromObservation);
	}
}

// ──────────────────────────────────────────────
// Mapping helpers
// ──────────────────────────────────────────────

function readMetadataString(
	metadata: Record<string, unknown>,
	key: string,
): string | undefined {
	const candidate = metadata[key];
	return typeof candidate === "string" && candidate.length > 0
		? candidate
		: undefined;
}

/** Company scope sent on save; companyId mirrors ruc for cross-surface consistency. */
interface EngramSaveScope {
	kind: "company";
	organizationId?: string;
	companyId: string;
	ruc: string;
	period: string;
}

function buildSaveScope(
	ruc: string,
	period: string,
	tenantId: string | undefined,
): EngramSaveScope {
	const scope: EngramSaveScope = {
		kind: "company",
		// Cross-surface consistency: the engine derives companyId=ruc, so we
		// store the ruc value in both fields.
		companyId: ruc,
		ruc,
		period,
	};
	if (tenantId !== undefined) scope.organizationId = tenantId;
	return scope;
}

/** Provenance sent on save; session recorded when present. */
interface EngramSaveSource {
	system: string;
	actorId: string;
	actorKind: "agent";
	model?: string;
	session?: string;
}

function buildSaveSource(
	input: SaveMemoryInput,
	system: string,
): EngramSaveSource {
	const source: EngramSaveSource = {
		system,
		actorId: input.agentId,
		actorKind: "agent",
	};
	if (input.sessionId !== undefined) source.session = input.sessionId;
	return source;
}

/**
 * Rebuild the read-scope params for engram reads from a MemoryScope.
 *
 * Requires scope.metadata.ruc (11 digits) for company reads; period defaults
 * to "" so a period-less scope only matches period-less observations.
 */
function readParamsFromScope(scope: MemoryScope): EngramReadParams {
	const ruc = readMetadataString(scope.metadata ?? {}, "ruc");
	if (ruc === undefined) {
		throw new EngramError("invalid-input", {
			code: "INVALID_SCOPE",
			message:
				"MemoryScope.metadata.ruc (11-digit RUC) is required for company-scoped engram reads",
		});
	}

	const tenantId =
		readMetadataString(scope.metadata ?? {}, "tenantId") ?? scope.tenantId;
	const period = readMetadataString(scope.metadata ?? {}, "period") ?? "";

	const params: EngramReadParams = { ruc, period };
	if (tenantId !== undefined && tenantId.length > 0) {
		params.organizationId = tenantId;
	}
	return params;
}

function recordFromSaveInput(
	input: SaveMemoryInput,
	observation: EngramObservation,
): MemoryRecord {
	const createdAt = toDate(observation.recordedAt ?? new Date().toISOString());
	const record: MemoryRecord = {
		id: observation.identity.id,
		agentId: input.agentId,
		scope: { ...input.scope },
		type: input.type,
		content: input.content,
		metadata: { ...input.metadata },
		createdAt,
		updatedAt: createdAt,
	};
	if (input.sessionId !== undefined) record.sessionId = input.sessionId;
	if (input.scope.metadata !== undefined) {
		record.scope.metadata = { ...input.scope.metadata };
	}
	return record;
}

function recordFromObservation(observation: EngramObservation): MemoryRecord {
	const scopeMetadata: Record<string, unknown> = {};
	if (observation.scope.ruc !== undefined && observation.scope.ruc.length > 0) {
		scopeMetadata.ruc = observation.scope.ruc;
	}
	if (
		observation.scope.period !== undefined &&
		observation.scope.period.length > 0
	) {
		scopeMetadata.period = observation.scope.period;
	}

	const record: MemoryRecord = {
		id: observation.identity.id,
		agentId: observation.source.actorId ?? "",
		scope: {
			tenantId: observation.scope.organizationId ?? "",
			metadata: scopeMetadata,
		},
		type: observation.kind,
		content: condenseObservationContent(observation),
		metadata: {},
		createdAt: toDate(observation.recordedAt ?? new Date().toISOString()),
		updatedAt: toDate(observation.recordedAt ?? new Date().toISOString()),
	};
	if (
		observation.source.session !== undefined &&
		observation.source.session.length > 0
	) {
		record.sessionId = observation.source.session;
	}
	return record;
}

function condenseObservationContent(observation: EngramObservation): string {
	return [observation.content.learned, observation.content.what]
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
		.join("\n");
}

function condense(records: MemoryRecord[]): string {
	return records
		.map((record) => record.content.trim())
		.filter((content) => content.length > 0)
		.join("\n");
}

function toDate(timestamp: string): Date {
	const parsed = new Date(timestamp);
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
