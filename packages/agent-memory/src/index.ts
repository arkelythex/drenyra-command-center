// ──────────────────────────────────────────────
// Backward-compatible re-exports from @arkelythex/platform-core/memory
// These ensure code importing from @arkelythex/agent-memory can also
// access the domain-agnostic @arkelythex/platform-core memory types.
//
// New code should import directly from @arkelythex/platform-core:
//   import type { MemoryRecord } from "@arkelythex/platform-core/memory";
// ──────────────────────────────────────────────
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
} from "@arkelythex/platform-core/memory";
export type { AgentMemoryStore } from "./agent-memory-store";
export { BunSqliteAgentMemoryStore } from "./bun-sqlite-agent-memory-store";
export {
	type CheckpointStatus,
	createCheckpoint,
	getAllCheckpoints,
	getCheckpointsByEntity,
	getRecentCheckpoints,
	rollbackToCheckpoint,
	seedDemoCheckpoints,
} from "./checkpoint-store";
export { InMemoryAgentMemoryStore } from "./in-memory-agent-memory-store";
export { type AgentMemoryApi, createMemoryApi } from "./memory-api";
export {
	type SessionCondenser,
	SimpleSessionCondenser,
} from "./session-condenser";
export {
	AGENT_MEMORY_TYPE,
	type AgentMemoryContext,
	type AgentMemoryContextQuery,
	type AgentMemoryMetadata,
	type AgentMemoryRecord,
	type AgentMemoryScope,
	type AgentMemorySearchQuery,
	type AgentMemorySearchResult,
	type AgentMemoryType,
	type Checkpoint,
	type SaveAgentMemoryInput,
} from "./types";
