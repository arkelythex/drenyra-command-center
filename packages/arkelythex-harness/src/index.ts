// ──────────────────────────────────────────────
// Backward-compatible re-exports from @arkelythex/platform-core/harness
// These ensure code importing from @arkelythex/harness can also
// access the domain-agnostic @arkelythex/platform-core harness types.
//
// New code should import directly from @arkelythex/platform-core:
//   import type { DelegationNode } from "@arkelythex/platform-core/harness";
// ──────────────────────────────────────────────
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
export type {
	ApprovalCondition,
	ApprovalConfig,
	ApprovalGate,
	ApprovalRequest,
	DelegationConfig,
	DelegationNode,
	DelegationPath,
	EvidenceConfig,
	EvidenceQuery,
	EvidenceRecord,
	HarnessAgentResult,
	HarnessExecuteRequest,
	HarnessExecutionContext,
	HarnessRunNode,
	HarnessSpawnChild,
	HarnessSpawnRequest,
	HarnessStatus,
} from "@arkelythex/platform-core/harness";
// ──────────────────────────────────────────────
// Deprecated schema re-exports from @arkelythex/platform-core/harness
//
// These Zod schemas moved to platform-core per ADR-030 Phase 1.1.
// Import directly from @arkelythex/platform-core/harness instead.
// ──────────────────────────────────────────────
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
/** @deprecated Import from @arkelythex/platform-core/harness */
export {
	HarnessAgentResultSchema,
	HarnessExecuteRequestSchema,
	HarnessExecutionContextSchema,
	HarnessRunNodeSchema,
	HarnessSpawnChildSchema,
	HarnessSpawnRequestSchema,
	HarnessStatusSchema,
} from "@arkelythex/platform-core/harness";
export {
	createDefaultHandler,
	registerDefaultHandlers,
} from "./handlers/defaults.js";
export * from "./harness.js";
export * from "./memory-context.js";
export * from "./types.js";
