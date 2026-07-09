/**
 * Fiscal Approval — Public API
 */

// Types
export type {
	ApprovalStatus,
	AccionFiscal,
	Recommendation,
	RecommendationSource,
	ApprovalAction,
	ApprovalGateConfig,
	ApprovalSummary,
} from "./types";

export { DEFAULT_APPROVAL_GATE_CONFIG } from "./types";

// Recommendation Engine
export {
	generateRecommendation,
	generateRecId,
	resetRecIdCounter,
	requiresApproval,
} from "./recommendation-engine";
export type { RecommendationInput } from "./recommendation-engine";

// Approval Store
export { approvalStore } from "./approval-store";

// Approval Gate
export { createApprovalGate } from "./approval-gate";
export type { ApprovalGateOptions } from "./approval-gate";

// Audit Trail
export { createAuditEntry, formatAuditEntry } from "./audit-trail";
export type { AuditEntry } from "./audit-trail";
