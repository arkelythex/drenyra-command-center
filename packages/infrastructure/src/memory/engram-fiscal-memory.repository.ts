/**
 * EngramFiscalMemoryRepository — engram-backed implementation of the domain
 * FiscalMemoryRepository port.
 *
 * Maps company-scoped fiscal memories (decisions, findings, monthly closing
 * notes, evidence references) to observations in the Drenyra Engram sidecar
 * (arkelythex/drenyra-engram). The engram chain model IS the fiscal revision
 * model: each save of the same (topicKey, exact scope) chain creates a new
 * immutable revision, which is exactly what FiscalMemoryRevision represents.
 *
 * Mapping:
 * - topicKey        `fiscal-memory/<memory.id>` (stable handle per memory)
 * - scope           tenantId -> organizationId, companyId = ruc, PERIOD-LESS.
 *                   Company identity is the RUC on the engine's HTTP/CLI
 *                   surfaces; the fiscal period lives in the learned
 *                   metadata (searchable + exactly reconstructable) so the
 *                   period-less search/context reads can match every fiscal
 *                   memory of the company regardless of period.
 * - title           `[<category>] <title>` — category is searchable text
 * - content.what    title (plain)
 * - content.why     summary
 * - content.where   evidenceRefs (one per line) — searchable
 * - content.learned JSON of {id, severity, status, tags, relatedMemoryIds,
 *                   approvedBy, sourceAgentId, updatedAt, revisionNumber?,
 *                   changeReason?} — searchable raw text AND parseable for
 *                   exact reconstruction
 * - provenance      actor = createdBy, timestamp = createdAt,
 *                   source = "api", session = sourceAgentId
 *
 * Scope enforcement (domain rule): every read is scoped by tenantId +
 * companyId + ruc; the engram scope is structural (exact match), so a
 * different tenant/company/RUC can never retrieve another tenant's memory.
 *
 * Non-authorizing: fiscal memories record what was decided or observed; the
 * adapter never approves or authorizes anything ("recordar no significa
 * autorizar"). Severity/status are deterministic metadata carried verbatim.
 *
 * No monetary fields exist in the fiscal-memory model; Drenyra money values
 * are BigInt cents (repo-wide rule) and nothing here touches them.
 *
 * @module @drenyra/memory/fiscal-memory
 */

import type {
	FiscalMemoryCategory,
	FiscalMemoryProps,
	FiscalMemoryRevision,
	FiscalMemoryScope,
	FiscalMemorySeverity,
	FiscalMemoryStatus,
} from "@drenyra/domain/fiscal-memory";
import {
	FiscalMemory,
	InvalidFiscalMemoryError,
} from "@drenyra/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@drenyra/domain/repositories/fiscal-memory.repository";
import type { EngramClient, EngramObservation } from "./engram-client";

const FISCAL_TOPIC_PREFIX = "fiscal-memory/";

/** Parseable fiscal metadata embedded in the observation's learned field. */
interface LearnedMeta {
	id: string;
	companyId?: string;
	period?: string;
	severity: FiscalMemorySeverity;
	status: FiscalMemoryStatus;
	tags: string[];
	relatedMemoryIds: string[];
	approvedBy?: string;
	sourceAgentId?: string;
	updatedAt: string;
	revisionNumber?: number;
	changeReason?: string;
}

/**
 * Normalize a fiscal period (YYYY-MM, domain grammar) to the engram YYYYMM
 * grammar. Accepts YYYYMM pass-through; fails closed otherwise.
 */
export function fiscalPeriodToEngram(period: string): string {
	const compact = period.replace("-", "");
	if (/^\d{6}$/.test(compact)) {
		return compact;
	}
	throw new InvalidFiscalMemoryError(
		"FISCAL_MEMORY_INVALID_PERIOD",
		`Invalid fiscal period "${period}" (expected YYYY-MM or YYYYMM)`,
	);
}

/** Reverse: engram YYYYMM -> domain YYYY-MM. */
export function engramPeriodToFiscal(period: string): string {
	if (!/^\d{6}$/.test(period)) {
		throw new InvalidFiscalMemoryError(
			"FISCAL_MEMORY_INVALID_PERIOD",
			`Invalid engram period "${period}" (expected YYYYMM)`,
		);
	}
	return `${period.slice(0, 4)}-${period.slice(4, 6)}`;
}

function scopeToEngram(scope: FiscalMemoryScope) {
	// Period-less company scope: the engine's HTTP/CLI surfaces derive
	// companyId from the RUC, and a perioded scope would be invisible to the
	// period-less search/context reads (the domain query interface provides no
	// period for most methods). The fiscal period lives in the learned
	// metadata; findByPeriod filters on it.
	return {
		kind: "company" as const,
		organizationId: scope.tenantId,
		companyId: scope.ruc,
		ruc: scope.ruc,
	};
}

function categoryOf(title: string): {
	category: FiscalMemoryCategory;
	title: string;
} {
	const match = /^\[([a-z_]+)\]\s?(.*)$/.exec(title);
	if (!match) {
		throw new InvalidFiscalMemoryError(
			"FISCAL_MEMORY_CORRUPT",
			`Observation title "${title}" has no category prefix`,
		);
	}
	const category = match[1];
	const rest = match[2] ?? "";
	return { category: category as FiscalMemoryCategory, title: rest };
}

/** Serialize the parseable fiscal metadata into content.learned. */
function learnedFromProps(props: FiscalMemoryProps): string {
	const meta: LearnedMeta = {
		id: props.id,
		companyId: props.companyId,
		period: props.period,
		severity: props.severity,
		status: props.status,
		tags: [...props.tags],
		relatedMemoryIds: [...(props.relatedMemoryIds ?? [])],
		updatedAt: props.updatedAt.toISOString(),
	};
	if (props.approvedBy) meta.approvedBy = props.approvedBy;
	if (props.sourceAgentId) meta.sourceAgentId = props.sourceAgentId;
	return JSON.stringify(meta);
}

function parseLearned(learned: string, id: string): Omit<LearnedMeta, "id"> {
	let meta: Partial<LearnedMeta>;
	try {
		meta = JSON.parse(learned) as Partial<LearnedMeta>;
	} catch {
		throw new InvalidFiscalMemoryError(
			"FISCAL_MEMORY_CORRUPT",
			`Observation ${id} has unparseable fiscal metadata`,
		);
	}
	const parsed: Omit<LearnedMeta, "id"> = {
		severity: meta.severity ?? "info",
		status: meta.status ?? "active",
		tags: meta.tags ?? [],
		relatedMemoryIds: meta.relatedMemoryIds ?? [],
		updatedAt: meta.updatedAt ?? "",
	};
	if (meta.companyId !== undefined) parsed.companyId = meta.companyId;
	if (meta.period !== undefined) parsed.period = meta.period;
	if (meta.approvedBy !== undefined) parsed.approvedBy = meta.approvedBy;
	if (meta.sourceAgentId !== undefined)
		parsed.sourceAgentId = meta.sourceAgentId;
	if (meta.revisionNumber !== undefined)
		parsed.revisionNumber = meta.revisionNumber;
	if (meta.changeReason !== undefined) parsed.changeReason = meta.changeReason;
	return parsed;
}

/** Reconstruct a FiscalMemory aggregate from a stored engram observation. */
export function observationToFiscalMemory(
	observation: EngramObservation,
): FiscalMemory {
	const topicKey = observation.identity.topicKey;
	if (!topicKey.startsWith(FISCAL_TOPIC_PREFIX)) {
		throw new InvalidFiscalMemoryError(
			"FISCAL_MEMORY_CORRUPT",
			`Observation ${observation.identity.id} is not a fiscal memory (topicKey ${topicKey})`,
		);
	}
	const id = topicKey.slice(FISCAL_TOPIC_PREFIX.length);
	const { category, title } = categoryOf(observation.title);
	const meta = parseLearned(observation.content.learned, id);
	if (title === undefined) {
		throw new InvalidFiscalMemoryError(
			"FISCAL_MEMORY_CORRUPT",
			`Observation ${id} has an empty title`,
		);
	}
	const evidenceRefs = observation.content.where
		.split("\n")
		.map((ref) => ref.trim())
		.filter(Boolean);

	const props: FiscalMemoryProps = {
		id,
		tenantId: observation.scope.organizationId ?? "",
		companyId: meta.companyId ?? observation.scope.companyId ?? "",
		ruc: observation.scope.ruc ?? "",
		// meta.period is the DOMAIN shape (YYYY-MM, from learnedFromProps); the
		// scope fallback is the engram shape (YYYYMM) and needs conversion.
		period:
			meta.period ??
			(observation.scope.period
				? engramPeriodToFiscal(observation.scope.period)
				: ""),
		category,
		severity: meta.severity,
		status: meta.status,
		title,
		summary: observation.content.why,
		evidenceRefs,
		tags: meta.tags,
		createdBy: observation.provenance.actor,
		relatedMemoryIds: meta.relatedMemoryIds,
		createdAt: new Date(observation.provenance.timestamp),
		updatedAt: meta.updatedAt
			? new Date(meta.updatedAt)
			: new Date(observation.provenance.timestamp),
		...(meta.approvedBy !== undefined ? { approvedBy: meta.approvedBy } : {}),
		...(meta.sourceAgentId !== undefined
			? { sourceAgentId: meta.sourceAgentId }
			: {}),
	};
	return FiscalMemory.rehydrate(props);
}

/**
 * Engram-backed FiscalMemoryRepository. Requires the engine's chain surface
 * (GET /v1/chain) for findById/findRevisions.
 */
export class EngramFiscalMemoryRepository implements FiscalMemoryRepository {
	private readonly client: EngramClient;

	constructor(client: EngramClient) {
		this.client = client;
	}

	async save(memory: FiscalMemory): Promise<void> {
		const props = memory.toJSON();
		const engramScope = scopeToEngram({
			tenantId: props.tenantId,
			companyId: props.companyId,
			ruc: props.ruc,
		});
		await this.client.save({
			topicKey: `${FISCAL_TOPIC_PREFIX}${props.id}`,
			title: `[${props.category}] ${props.title}`,
			type: "fiscal_memory",
			scope: engramScope,
			content: {
				what: props.title,
				why: props.summary,
				// The engine requires all four content fields non-empty; a valid
				// domain memory with no evidence refs must not produce an empty
				// where field.
				where:
					props.evidenceRefs.length > 0
						? props.evidenceRefs.join("\n")
						: "no evidence refs recorded",
				learned: learnedFromProps(props),
			},
			provenance: {
				actor: props.createdBy,
				timestamp: props.createdAt.toISOString(),
				source: "api",
				...(props.sourceAgentId !== undefined
					? { session: props.sourceAgentId }
					: {}),
			},
		});
	}

	async findById(
		id: string,
		scope: FiscalMemoryScope,
	): Promise<FiscalMemory | null> {
		// The domain scope carries no period, so the exact chain scope cannot
		// be built; the id is embedded in the searchable learned metadata, so a
		// scoped search matches the memory and the topicKey filter is exact.
		const results = await this.client.search({
			q: id,
			ruc: scope.ruc,
			organizationId: scope.tenantId,
		});
		const exact = results
			.map((result) => result.observation)
			.filter(
				(observation) =>
					observation.identity.topicKey === `${FISCAL_TOPIC_PREFIX}${id}`,
			);
		const latest = exact[0];
		if (latest === undefined) return null;
		// Search dedupes to the latest revision per chain.
		return observationToFiscalMemory(latest);
	}

	async findByPeriod(
		scope: FiscalMemoryScope,
		period: string,
	): Promise<FiscalMemory[]> {
		// The domain scope carries no period and the engram scope is
		// period-less (the period lives in the learned metadata), so the query
		// returns the company's fiscal memories and filters by the exact
		// period.
		const target = fiscalPeriodToEngram(period);
		const observations = await this.client.context({
			ruc: scope.ruc,
			organizationId: scope.tenantId,
		});
		return observations
			.filter((observation) => observation.type === "fiscal_memory")
			.map(observationToFiscalMemory)
			.filter((memory) => fiscalPeriodToEngram(memory.period) === target);
	}

	async findByCategory(
		scope: FiscalMemoryScope,
		category: FiscalMemoryCategory,
	): Promise<FiscalMemory[]> {
		const results = await this.client.search({
			q: category,
			ruc: scope.ruc,
			organizationId: scope.tenantId,
		});
		return this.filterByCategory(
			results.map((result) => result.observation),
			category,
		);
	}

	async findBySeverity(
		scope: FiscalMemoryScope,
		severity: FiscalMemorySeverity,
	): Promise<FiscalMemory[]> {
		const results = await this.client.search({
			q: severity,
			ruc: scope.ruc,
			organizationId: scope.tenantId,
		});
		return this.memoriesFrom(
			results.map((result) => result.observation),
		).filter((memory) => memory.severity === severity);
	}

	async findByEvidenceRef(
		scope: FiscalMemoryScope,
		evidenceRef: string,
	): Promise<FiscalMemory[]> {
		const results = await this.client.search({
			q: evidenceRef,
			ruc: scope.ruc,
			organizationId: scope.tenantId,
		});
		return this.memoriesFrom(
			results.map((result) => result.observation),
		).filter((memory) => memory.evidenceRefs.includes(evidenceRef));
	}

	async findRelated(
		scope: FiscalMemoryScope,
		memoryId: string,
	): Promise<FiscalMemory[]> {
		const results = await this.client.search({
			q: memoryId,
			ruc: scope.ruc,
			organizationId: scope.tenantId,
		});
		return this.memoriesFrom(
			results.map((result) => result.observation),
		).filter((memory) => (memory.relatedMemoryIds ?? []).includes(memoryId));
	}

	async saveRevision(revision: FiscalMemoryRevision): Promise<void> {
		// The engram chain revision IS the fiscal revision: save the next state
		// on the same chain, carrying the revision metadata in learned.
		const props = revision.nextValue;
		const meta = JSON.parse(learnedFromProps(props)) as LearnedMeta;
		meta.revisionNumber = revision.revisionNumber;
		meta.changeReason = revision.changeReason;
		const engramScope = scopeToEngram({
			tenantId: props.tenantId,
			companyId: props.companyId,
			ruc: props.ruc,
		});
		await this.client.save({
			topicKey: `${FISCAL_TOPIC_PREFIX}${props.id}`,
			title: `[${props.category}] ${props.title}`,
			type: "fiscal_memory",
			scope: engramScope,
			content: {
				what: props.title,
				why: props.summary,
				where:
					props.evidenceRefs.length > 0
						? props.evidenceRefs.join("\n")
						: "no evidence refs recorded",
				learned: JSON.stringify(meta),
			},
			provenance: {
				actor: revision.changedBy,
				timestamp: revision.createdAt.toISOString(),
				source: "api",
				...(props.sourceAgentId !== undefined
					? { session: props.sourceAgentId }
					: {}),
			},
		});
	}

	async findRevisions(memoryId: string): Promise<FiscalMemoryRevision[]> {
		// The domain interface provides NO scope for this query, and the engram
		// engine's reads are scope-first (a company search requires a valid
		// RUC; the chain surface requires the exact scope). An unscoped query
		// would violate the engine's structural isolation, so the engram
		// adapter fails closed: revision history is served through the
		// scope-exact chain surface (GET /v1/chain), which callers reach with
		// the scope they already hold.
		throw new InvalidFiscalMemoryError(
			"FISCAL_MEMORY_NO_SCOPE",
			`findRevisions("${memoryId}") has no scope in the domain interface; ` +
				"the engram adapter is scope-first and cannot run an unscoped query — " +
				"use the chain surface with an explicit company scope",
		);
	}

	// memoriesFrom converts search results to fiscal memories, SKIPPING
	// non-fiscal observations (mission results, session records, etc.) that a
	// token-overlap search may return in the same scope — a mixed result set
	// must never crash a query (found by the live integration test).
	private memoriesFrom(observations: EngramObservation[]): FiscalMemory[] {
		const memories: FiscalMemory[] = [];
		for (const observation of observations) {
			try {
				memories.push(observationToFiscalMemory(observation));
			} catch {
				// Not a fiscal memory (or a corrupt row) — skip, never throw.
			}
		}
		return memories;
	}

	private filterByCategory(
		observations: EngramObservation[],
		category: FiscalMemoryCategory,
	): FiscalMemory[] {
		return this.memoriesFrom(observations).filter(
			(memory) => memory.category === category,
		);
	}
}
