/**
 * Memory Module — Public API.
 *
 * Domain-agnostic agent memory and session storage, backed by the Drenyra
 * Engram sidecar (arkelythex/drenyra-engram) when enabled.
 *
 * @module @drenyra/memory
 */

export {
	DEFAULT_ENGRAM_TIMEOUT_MS,
	DEFAULT_ENGRAM_URL,
	type EngramConfig,
	engramConfig,
	isEngramEnabled,
} from "./config.js";
export {
	ENGRAM_AUTHORITY_STATUS,
	ENGRAM_SCOPE_KIND,
	ENGRAM_WRITE_OUTCOME,
	type EngramAuthorityStatus,
	EngramClient,
	type EngramClientOptions,
	type EngramContent,
	type EngramDoctorReport,
	EngramError,
	type EngramErrorKind,
	type EngramErrorOptions,
	type EngramIdentity,
	type EngramObservation,
	type EngramProvenance,
	type EngramReadParams,
	type EngramSaveInput,
	type EngramSaveResponse,
	type EngramScope,
	type EngramScopeKind,
	type EngramSearchParams,
	type EngramSearchResult,
	type EngramValidity,
	type EngramWriteOutcome,
} from "./engram-client.js";
export {
	EngramFiscalMemoryRepository,
	engramPeriodToFiscal,
	fiscalPeriodToEngram,
	observationToFiscalMemory,
} from "./engram-fiscal-memory.repository.js";
export {
	EngramSessionStore,
	type EngramSessionStoreOptions,
} from "./engram-session-store.js";
export type { SessionStore } from "./session-store.js";
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
