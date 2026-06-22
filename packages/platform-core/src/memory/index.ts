/**
 * Memory Module — Public API.
 *
 * Domain-agnostic agent memory and session storage.
 *
 * @module @arkelythex/platform-core/memory
 */

export type { SessionStore } from "./session-store.js";
export { MemoryStore, type MemoryStoreOptions } from "./memory-store.js";
export { SqliteSessionStore } from "./sqlite-store.js";
export type { SqliteSessionStoreOptions } from "./sqlite-store.js";
export type {
  SessionConfig,
  StoreConfig,
  MemoryScope,
  MemoryRecord,
  SaveMemoryInput,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryContextQuery,
  MemoryContext,
} from "./types.js";
