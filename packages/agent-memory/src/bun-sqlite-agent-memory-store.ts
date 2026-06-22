import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AgentMemoryStore } from "./agent-memory-store";
import {
	SimpleSessionCondenser,
	type SessionCondenser,
} from "./session-condenser";
import type {
	AgentMemoryContext,
	AgentMemoryContextQuery,
	AgentMemoryRecord,
	AgentMemoryScope,
	AgentMemorySearchQuery,
	AgentMemorySearchResult,
	SaveAgentMemoryInput,
} from "./types";

export interface BunSqliteAgentMemoryStoreOptions {
	path: string;
	condenser?: SessionCondenser;
}

interface PersistedAgentMemoryRecord {
	id: string;
	agentId: string;
	sessionId?: string;
	scope: AgentMemoryScope;
	type: AgentMemoryRecord["type"];
	content: string;
	metadata: AgentMemoryRecord["metadata"];
	createdAt: string;
	updatedAt: string;
}

export class BunSqliteAgentMemoryStore implements AgentMemoryStore {
	private readonly records: AgentMemoryRecord[] = [];

	private constructor(
		private readonly path: string,
		private readonly condenser: SessionCondenser,
	) {}

	static async create(
		options: BunSqliteAgentMemoryStoreOptions,
	): Promise<BunSqliteAgentMemoryStore> {
		const store = new BunSqliteAgentMemoryStore(
			options.path,
			options.condenser ?? new SimpleSessionCondenser(),
		);
		await store.load();
		return store;
	}

	async save(input: SaveAgentMemoryInput): Promise<AgentMemoryRecord> {
		const now = new Date();
		const record: AgentMemoryRecord = {
			id: `mem_${(this.records.length + 1).toString().padStart(8, "0")}`,
			agentId: input.agentId,
			...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
			scope: { ...input.scope },
			type: input.type,
			content: input.content,
			metadata: { ...input.metadata },
			createdAt: now,
			updatedAt: now,
		};

		this.records.push(record);
		await this.flush();

		return cloneRecord(record);
	}

	async search(
		query: AgentMemorySearchQuery,
	): Promise<AgentMemorySearchResult[]> {
		const terms = tokenize(query.text);

		return this.records
			.filter((record) => isScopeMatch(record.scope, query.scope))
			.filter(
				(record) =>
					query.agentId === undefined || record.agentId === query.agentId,
			)
			.map((record) => ({ record, score: scoreRecord(record, terms) }))
			.filter((result) => result.score > 0)
			.sort(
				(left, right) =>
					right.score - left.score ||
					left.record.createdAt.getTime() - right.record.createdAt.getTime(),
			)
			.slice(0, query.limit ?? 10)
			.map((result) => ({
				record: cloneRecord(result.record),
				score: result.score,
			}));
	}

	async context(query: AgentMemoryContextQuery): Promise<AgentMemoryContext> {
		const sessionRecords =
			query.sessionId === undefined
				? []
				: await this.getBySession(query.sessionId, query.scope);
		const searchRecords =
			query.text === undefined
				? []
				: (
						await this.search({
							text: query.text,
							scope: query.scope,
							limit: query.limit,
						})
					).map((result) => result.record);

		const records = uniqueRecords([...sessionRecords, ...searchRecords]).slice(
			0,
			query.limit ?? 10,
		);

		return {
			records,
			summary: this.condenser.condense(records),
		};
	}

	async getBySession(
		sessionId: string,
		scope: AgentMemoryScope,
	): Promise<AgentMemoryRecord[]> {
		return this.records
			.filter((record) => record.sessionId === sessionId)
			.filter((record) => isScopeMatch(record.scope, scope))
			.sort(
				(left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
			)
			.map(cloneRecord);
	}

	close(): void {
		// File-backed fallback does not keep an open handle.
	}

	private async load(): Promise<void> {
		try {
			const raw = await readFile(this.path, "utf8");
			const persisted = JSON.parse(raw) as unknown;
			if (!Array.isArray(persisted)) return;

			this.records.splice(
				0,
				this.records.length,
				...persisted.filter(isPersistedRecord).map(fromPersistedRecord),
			);
		} catch (error) {
			if (isNodeError(error) && error.code === "ENOENT") return;
			throw error;
		}
	}

	private async flush(): Promise<void> {
		await mkdir(dirname(this.path), { recursive: true });
		await writeFile(
			this.path,
			JSON.stringify(this.records.map(toPersistedRecord), null, 2),
			"utf8",
		);
	}
}

function isScopeMatch(
	recordScope: AgentMemoryScope,
	queryScope: AgentMemoryScope,
): boolean {
	return (
		recordScope.tenantId === queryScope.tenantId &&
		optionalScopeMatches(
			recordScope.organizationId,
			queryScope.organizationId,
		) &&
		optionalScopeMatches(recordScope.companyId, queryScope.companyId) &&
		optionalScopeMatches(recordScope.ruc, queryScope.ruc)
	);
}

function optionalScopeMatches(
	recordValue: string | undefined,
	queryValue: string | undefined,
): boolean {
	return queryValue === undefined || recordValue === queryValue;
}

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^a-z0-9áéíóúñ]+/iu)
		.map((term) => term.trim())
		.filter((term) => term.length > 0);
}

function scoreRecord(record: AgentMemoryRecord, terms: string[]): number {
	const searchable = [
		record.content,
		record.agentId,
		record.type,
		...(record.metadata.tags ?? []),
	]
		.join(" ")
		.toLowerCase();

	return terms.reduce(
		(score, term) => score + (searchable.includes(term) ? 1 : 0),
		0,
	);
}

function uniqueRecords(records: AgentMemoryRecord[]): AgentMemoryRecord[] {
	const seen = new Set<string>();
	const unique: AgentMemoryRecord[] = [];

	for (const record of records) {
		if (seen.has(record.id)) continue;
		seen.add(record.id);
		unique.push(record);
	}

	return unique;
}

function cloneRecord(record: AgentMemoryRecord): AgentMemoryRecord {
	return {
		...record,
		scope: { ...record.scope },
		metadata: { ...record.metadata },
		createdAt: new Date(record.createdAt),
		updatedAt: new Date(record.updatedAt),
	};
}

function toPersistedRecord(
	record: AgentMemoryRecord,
): PersistedAgentMemoryRecord {
	return {
		...record,
		scope: { ...record.scope },
		metadata: { ...record.metadata },
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

function fromPersistedRecord(
	record: PersistedAgentMemoryRecord,
): AgentMemoryRecord {
	return {
		...record,
		scope: { ...record.scope },
		metadata: { ...record.metadata },
		createdAt: new Date(record.createdAt),
		updatedAt: new Date(record.updatedAt),
	};
}

function isPersistedRecord(
	value: unknown,
): value is PersistedAgentMemoryRecord {
	return (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"agentId" in value &&
		"scope" in value &&
		"type" in value &&
		"content" in value &&
		"metadata" in value &&
		"createdAt" in value &&
		"updatedAt" in value
	);
}

function isNodeError(value: unknown): value is NodeJS.ErrnoException {
	return typeof value === "object" && value !== null && "code" in value;
}
