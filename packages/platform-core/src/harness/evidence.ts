/**
 * Evidence Store — domain-agnostic evidence recording.
 *
 * Records evidence during harness execution for auditability.
 * Domain-agnostic — no tax document types or fiscal-specific fields.
 *
 * @module @drenyra/platform-core/harness
 */

import type { EvidenceQuery, EvidenceRecord } from "./types.js";

/**
 * Evidence store interface.
 *
 * Implementations can be in-memory, SQLite-backed, or any other backend.
 */
export interface EvidenceStore {
  /** Persist a new evidence record */
  save(record: EvidenceRecord): Promise<void>;

  /** Retrieve evidence records matching the given query */
  query(query: EvidenceQuery): Promise<EvidenceRecord[]>;

  /** Get a single evidence record by ID */
  getById(id: string): Promise<EvidenceRecord | null>;

  /** Delete evidence records for a run */
  deleteByRun(runId: string): Promise<void>;
}

/**
 * Options for creating an {@link InMemoryEvidenceStore}.
 */
export interface InMemoryEvidenceStoreOptions {
  /** Maximum records before auto-pruning oldest (default: unlimited) */
  maxRecords?: number;
}

/**
 * In-memory implementation of {@link EvidenceStore}.
 *
 * Useful for testing and development.
 *
 * @example
 * ```ts
 * const store = new InMemoryEvidenceStore();
 * await store.save({
 *   id: "ev-1",
 *   runId: "run-1",
 *   type: "agent-result",
 *   content: { status: "done" },
 *   timestamp: new Date().toISOString(),
 * });
 *
 * const results = await store.query({ runId: "run-1" });
 * ```
 */
export class InMemoryEvidenceStore implements EvidenceStore {
  private readonly records: EvidenceRecord[] = [];
  private readonly maxRecords: number;

  constructor(options?: InMemoryEvidenceStoreOptions) {
    this.maxRecords = options?.maxRecords ?? Infinity;
  }

  async save(record: EvidenceRecord): Promise<void> {
    this.records.push({ ...record, content: structuredClone(record.content) });

    // Prune oldest records if over limit
    while (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }

  async query(query: EvidenceQuery): Promise<EvidenceRecord[]> {
    const limit = query.limit ?? 50;

    let results = [...this.records];

    if (query.runId !== undefined) {
      results = results.filter((r) => r.runId === query.runId);
    }

    if (query.type !== undefined) {
      results = results.filter((r) => r.type === query.type);
    }

    // Sort by timestamp descending (newest first)
    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return results.slice(0, limit);
  }

  async getById(id: string): Promise<EvidenceRecord | null> {
    const record = this.records.find((r) => r.id === id);
    return record ? { ...record, content: structuredClone(record.content) } : null;
  }

  async deleteByRun(runId: string): Promise<void> {
    let i = 0;
    while (i < this.records.length) {
      if (this.records[i].runId === runId) {
        this.records.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  /**
   * Get total count of stored records.
   */
  get count(): number {
    return this.records.length;
  }
}
