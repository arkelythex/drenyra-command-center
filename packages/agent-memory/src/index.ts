export { BunSqliteAgentMemoryStore } from "./bun-sqlite-agent-memory-store";
export type { AgentMemoryStore } from "./agent-memory-store";
export { InMemoryAgentMemoryStore } from "./in-memory-agent-memory-store";
export { createMemoryApi, type AgentMemoryApi } from "./memory-api";
export {
	SimpleSessionCondenser,
	type SessionCondenser,
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
	type SaveAgentMemoryInput,
	type Checkpoint,
} from "./types";

export {
	createCheckpoint,
	rollbackToCheckpoint,
	getCheckpointsByEntity,
	getRecentCheckpoints,
	getAllCheckpoints,
	seedDemoCheckpoints,
	type CheckpointStatus,
} from "./checkpoint-store";

// ──────────────────────────────────────────────
// Backward-compatible re-exports from @arkelythex/platform-core/memory
// These ensure code importing from @arkelythex/agent-memory can also
// access the domain-agnostic @arkelythex/platform-core memory types.
//
// New code should import directly from @arkelythex/platform-core:
//   import type { MemoryRecord } from "@arkelythex/platform-core/memory";
// ──────────────────────────────────────────────
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
} from "@arkelythex/platform-core/memory";
