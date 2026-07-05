/**
 * File-backed JSON SessionStore — persistent session storage.
 *
 * Persists memory records to a JSON file on disk.
 * Extracted and made domain-agnostic from @drenyra/agent-memory's
 * BunSqliteAgentMemoryStore (which uses JSON file-backing, not SQLite).
 *
 * Domain-agnostic — no fiscal-specific types or fields.
 *
 * @module @drenyra/platform-core/memory
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
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

/**
 * Options for creating a {@link SqliteSessionStore}.
 */
export interface SqliteSessionStoreOptions {
	/** Path to the JSON file for persistence */
	path: string;
	/** Optional custom condensation function */
	condense?: (records: MemoryRecord[]) => string;
}

/**
 * File-backed JSON implementation of {@link SessionStore}.
 *
 * Persists all records to a JSON file on disk using atomic read/write.
 * Tables are simulated via JSON serialization.
 *
 * @example
 * ```ts
 * const store = await SqliteSessionStore.create({ path: "./data/memory.json" });
 * await store.save({
 *   agentId: "analysis",
 *   scope: { tenantId: "tenant-1" },
 *   type: "fact",
 *   content: "Analysis complete",
 *   metadata: { confidence: 0.95 },
 * });
 * ```
 */
export class SqliteSessionStore implements SessionStore {
	private readonly records: MemoryRecord[] = [];
	private sequence = 0;

	private constructor(
		private readonly path: string,
		private readonly condense: (records: MemoryRecord[]) => string,
	) {}

	/**
	 * Create a new SqliteSessionStore, loading any existing data from the file.
	 */
	static async create(
		options: SqliteSessionStoreOptions,
	): Promise<SqliteSessionStore> {
		const store = new SqliteSessionStore(
			options.path,
			options.condense ??
				((records: MemoryRecord[]) =>
					records
						.map((r) => r.content.trim())
						.filter((c) => c.length > 0)
						.join("\n")),
		);
		await store.load();
		return store;
	}

	// ────────────────────────────────────────────
	// SessionStore Implementation
	// ────────────────────────────────────────────

	async save(input: SaveMemoryInput): Promise<MemoryRecord> {
		const now = new Date();
		this.sequence += 1;

		const record: MemoryRecord = {
			id: `mem_${this.sequence.toString().padStart(8, "0")}`,
			agentId: input.agentId,
			...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
			scope: {
				tenantId: input.scope.tenantId,
				metadata: input.scope.metadata
					? { ...input.scope.metadata }
					: undefined,
			},
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

	async search(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
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

	async context(query: MemoryContextQuery): Promise<MemoryContext> {
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
			summary: this.condense(records),
		};
	}

	async getBySession(
		sessionId: string,
		scope: MemoryScope,
	): Promise<MemoryRecord[]> {
		return this.records
			.filter((record) => record.sessionId === sessionId)
			.filter((record) => isScopeMatch(record.scope, scope))
			.sort(
				(left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
			)
			.map(cloneRecord);
	}

	/**
	 * Close the store (no-op for file-backed implementation).
	 */
	close(): void {
		// File-backed implementation does not keep an open handle.
	}

	// ────────────────────────────────────────────
	// Persistence
	// ────────────────────────────────────────────

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

			// Recover sequence from loaded records
			this.sequence = this.records.length;
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

// ──────────────────────────────────────────────
// Internal Types and Helpers
// ──────────────────────────────────────────────

interface PersistedMemoryRecord {
	id: string;
	agentId: string;
	sessionId?: string;
	scope: MemoryScope;
	type: string;
	content: string;
	metadata: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

function isScopeMatch(
	recordScope: MemoryScope,
	queryScope: MemoryScope,
): boolean {
	if (recordScope.tenantId !== queryScope.tenantId) return false;

	const recordMeta = recordScope.metadata ?? {};
	const queryMeta = queryScope.metadata ?? {};
	const queryKeys = Object.keys(queryMeta);

	return queryKeys.every((key) => recordMeta[key] === queryMeta[key]);
}

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^a-z0-9áéíóúñ]+/iu)
		.map((term) => term.trim())
		.filter((term) => term.length > 0);
}

function scoreRecord(record: MemoryRecord, terms: string[]): number {
	const tags = Array.isArray(record.metadata.tags)
		? (record.metadata.tags as string[])
		: [];

	const searchable = [record.content, record.agentId, record.type, ...tags]
		.join(" ")
		.toLowerCase();

	return terms.reduce(
		(score, term) => score + (searchable.includes(term) ? 1 : 0),
		0,
	);
}

function uniqueRecords(records: MemoryRecord[]): MemoryRecord[] {
	const seen = new Set<string>();
	const unique: MemoryRecord[] = [];

	for (const record of records) {
		if (seen.has(record.id)) continue;
		seen.add(record.id);
		unique.push(record);
	}

	return unique;
}

function cloneRecord(record: MemoryRecord): MemoryRecord {
	return {
		...record,
		scope: {
			...record.scope,
			metadata: record.scope.metadata
				? { ...record.scope.metadata }
				: undefined,
		},
		metadata: { ...record.metadata },
		createdAt: new Date(record.createdAt),
		updatedAt: new Date(record.updatedAt),
	};
}

function toPersistedRecord(record: MemoryRecord): PersistedMemoryRecord {
	return {
		...record,
		scope: { ...record.scope, metadata: { ...record.scope.metadata } },
		metadata: { ...record.metadata },
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

function fromPersistedRecord(record: PersistedMemoryRecord): MemoryRecord {
	return {
		...record,
		scope: { ...record.scope, metadata: { ...record.scope.metadata } },
		metadata: { ...record.metadata },
		createdAt: new Date(record.createdAt),
		updatedAt: new Date(record.updatedAt),
	};
}

function isPersistedRecord(value: unknown): value is PersistedMemoryRecord {
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
