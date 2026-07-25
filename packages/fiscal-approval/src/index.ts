/**
 * Fiscal Approval — Public API
 */

export type { ApprovalGateOptions } from "./approval-gate";
// Approval Gate
export { createApprovalGate } from "./approval-gate";
// Approval Store
export { approvalStore } from "./approval-store";
export type { AuditEntry } from "./audit-trail";
// Audit Trail
export { createAuditEntry, formatAuditEntry } from "./audit-trail";
export type { RecommendationInput } from "./recommendation-engine";
// Recommendation Engine
export {
	generateRecId,
	generateRecommendation,
	requiresApproval,
	resetRecIdCounter,
} from "./recommendation-engine";
// Types
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
