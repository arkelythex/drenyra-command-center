/**
 * Memory Module — Public API.
 *
 * Domain-agnostic agent memory and session storage.
 *
 * @module @drenyra/platform-core/memory
 */

export { MemoryStore, type MemoryStoreOptions } from "./memory-store.js";
export type { SessionStore } from "./session-store.js";
export type { SqliteSessionStoreOptions } from "./sqlite-store.js";
export { SqliteSessionStore } from "./sqlite-store.js";
export type {
	MemoryContext,
	MemoryContextQuery,
	MemoryRecord,
	MemoryScope,
	MemorySearchQuery,
	MemorySearchResult,
	SaveMemoryInput,
	SessionConfig,
	StoreConfig,
} from "./types.js";
