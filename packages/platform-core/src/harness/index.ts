/**
 * Harness Module — Public API.
 *
 * Domain-agnostic agent execution harness with delegation graph,
 * approval workflow, and evidence store.
 *
 * @module @arkelythex/platform-core/harness
 */

export { ApprovalWorkflow } from "./approval.js";
export { DelegationGraph } from "./delegation.js";
export {
	type EvidenceStore,
	InMemoryEvidenceStore,
	type InMemoryEvidenceStoreOptions,
} from "./evidence.js";
export type {
	HarnessAgentResult,
	HarnessExecuteRequest,
	HarnessExecutionContext,
	HarnessRunNode,
	HarnessSpawnChild,
	HarnessSpawnRequest,
	HarnessStatus,
} from "./schemas.js";

// ──────────────────────────────────────────────
// Harness Zod Schemas — from types.ts ⇒ platform-core
//
// Moved here per ADR-030 Phase 1.1 to make @arkelythex/harness
// Zod-free. Re-exported from platform-core so consumers always
// import from @arkelythex/platform-core/harness.
// ──────────────────────────────────────────────
export {
	HarnessAgentResultSchema,
	HarnessExecuteRequestSchema,
	HarnessExecutionContextSchema,
	HarnessRunNodeSchema,
	HarnessSpawnChildSchema,
	HarnessSpawnRequestSchema,
	HarnessStatusSchema,
} from "./schemas.js";
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
} from "./types.js";
