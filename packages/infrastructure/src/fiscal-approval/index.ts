/**
 * Fiscal Approval facade — compatibility re-export from @drenyra/infrastructure.
 *
 * Owned by drenyra-ai; this facade preserves the existing @drenyra/fiscal-approval
 * surface while the canonical implementation migrates to its own repository.
 */
export type { ApprovalGateOptions } from "./approval-gate";
export { createApprovalGate } from "./approval-gate";
export { approvalStore } from "./approval-store";
export type { AuditEntry } from "./audit-trail";
export { createAuditEntry, formatAuditEntry } from "./audit-trail";
export type { RecommendationInput } from "./recommendation-engine";
export {
	generateRecId,
	generateRecommendation,
	requiresApproval,
	resetRecIdCounter,
} from "./recommendation-engine";
export type {
	AccionFiscal,
	ApprovalAction,
	ApprovalGateConfig,
	ApprovalStatus,
	ApprovalSummary,
	Recommendation,
	RecommendationSource,
} from "./types";
export { DEFAULT_APPROVAL_GATE_CONFIG } from "./types";
