/**
 * In-memory SessionStore Implementation.
 *
 * A lightweight in-memory store for testing and development.
 * All data is lost when the process exits. Not suitable for production.
 *
 * @module @drenyra/platform-core/memory
 */

import type {
  MemoryContext,
  MemoryContextQuery,
  MemoryRecord,
  MemoryScope,
  MemorySearchQuery,
  MemorySearchResult,
  SaveMemoryInput,
} from "./types.js";
import type { SessionStore } from "./session-store.js";

/**
 * Configuration for the in-memory memory store.
 */
export interface MemoryStoreOptions {
  /** Optional custom condensation function */
  condense?: (records: MemoryRecord[]) => string;
}

/**
 * In-memory implementation of {@link SessionStore}.
 *
 * Useful for unit testing and development where persistence is not required.
 *
 * @example
 * ```ts
 * const store = new MemoryStore();
 * await store.save({
 *   agentId: "analysis",
 *   sessionId: "sess-1",
 *   scope: { tenantId: "tenant-1" },
 *   type: "fact",
 *   content: "Analysis complete",
 *   metadata: { confidence: 0.95 },
 * });
 * const results = await store.search({ text: "analysis", scope: { tenantId: "tenant-1" } });
 * ```
 */
export class MemoryStore implements SessionStore {
  private readonly records: MemoryRecord[] = [];
  private sequence = 0;
  private readonly condense: (records: MemoryRecord[]) => string;

  constructor(options?: MemoryStoreOptions) {
    this.condense =
      options?.condense ?? ((records: MemoryRecord[]) =>
        records
          .map((r) => r.content.trim())
          .filter((c) => c.length > 0)
          .join("\n")
      );
  }

  async save(input: SaveMemoryInput): Promise<MemoryRecord> {
    const now = new Date();
    this.sequence += 1;

    const record: MemoryRecord = {
      id: `mem_${this.sequence.toString().padStart(8, "0")}`,
      agentId: input.agentId,
      ...(input.sessionId === undefined ? {} : { sessionId: input.sessionId }),
      scope: { ...input.scope, metadata: { ...input.scope.metadata } },
      type: input.type,
      content: input.content,
      metadata: { ...input.metadata },
      createdAt: now,
      updatedAt: now,
    };

    this.records.push(record);
    return cloneRecord(record);
  }

  async search(
    query: MemorySearchQuery,
  ): Promise<MemorySearchResult[]> {
    const terms = tokenize(query.text);
    const limit = query.limit ?? 10;

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
      .slice(0, limit)
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
}

// ──────────────────────────────────────────────
// Internal Helpers (same algorithm as original, domain-agnostic)
// ──────────────────────────────────────────────

function isScopeMatch(
  recordScope: MemoryScope,
  queryScope: MemoryScope,
): boolean {
  if (recordScope.tenantId !== queryScope.tenantId) return false;

  // If either side has no metadata keys, full match on tenantId is sufficient
  const recordMeta = recordScope.metadata ?? {};
  const queryMeta = queryScope.metadata ?? {};
  const queryKeys = Object.keys(queryMeta);

  // Every key in the query must match the corresponding key in the record
  return queryKeys.every(
    (key) => recordMeta[key] === queryMeta[key],
  );
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
