/**
 * SessionStore Interface.
 *
 * Domain-agnostic interface for agent memory and session storage.
 * Implementations can be file-backed, SQLite, in-memory, or any other backend.
 *
 * Zero fiscal imports — all types are generic and reusable across verticals.
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

/**
 * Persistent store for agent memory records.
 *
 * Supports:
 * - Save new memory records with tenant-scoped isolation
 * - Full-text search across content, agentId, type, and tags
 * - Session-scoped retrieval
 * - Context building (session records + search results + condensation)
 */
export interface SessionStore {
	/**
	 * Persist a new memory record.
	 * Returns the saved record with generated id and timestamps.
	 */
	save(input: SaveMemoryInput): Promise<MemoryRecord>;

	/**
	 * Search memory records by text relevance within a scope.
	 * Results are sorted by relevance score descending.
	 */
	search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;

	/**
	 * Build aggregated memory context by combining session records
	 * and optional text search results, with a condensed summary.
	 */
	context(query: MemoryContextQuery): Promise<MemoryContext>;

	/**
	 * Retrieve all records for a session, sorted by creation order.
	 */
	getBySession(sessionId: string, scope: MemoryScope): Promise<MemoryRecord[]>;
}
