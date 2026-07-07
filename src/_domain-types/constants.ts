/**
 * Canonical constants for Fiscal Truth Engine contracts.
 *
 * These literals are the only allowed public values for fiscal-truth
 * domain contracts. They are intentionally centralized to keep replay,
 * evidence, and governance reason codes stable and auditable.
 */

export const TRUTH_EVENT_KIND = {
	AUTHORITATIVE_TRUTH_PROMOTED: "authoritative_truth_promoted",
	AUTHORITATIVE_TRUTH_REJECTED: "authoritative_truth_rejected",
} as const;

export const EVIDENCE_NODE_KIND = {
	SOURCE_INPUT: "source_input",
	DETERMINISTIC_VALIDATION: "deterministic_validation",
	POLICY_DECISION: "policy_decision",
	APPROVAL: "approval",
	AI_SUGGESTION: "ai_suggestion",
} as const;

export const EVIDENCE_EDGE_KIND = {
	PROVES: "proves",
	REFERENCES: "references",
	DEPENDS_ON: "depends_on",
} as const;

export const GOVERNANCE_REVIEW_STATUS = {
	PENDING: "pending",
	APPROVED: "approved",
	REJECTED: "rejected",
	WAIVED: "waived",
} as const;

export const POLICY_OUTCOME = {
	ALLOWED: "allowed",
	DENIED: "denied",
	REVIEW: "review",
} as const;

export const REPLAY_FAILURE_CODE = {
	VERSION_MISMATCH: "version_mismatch",
	MISSING_TRACE: "missing_trace",
	HASH_MISMATCH: "hash_mismatch",
	PERMISSION_CHANGED: "permission_changed",
} as const;

export const DETERMINISTIC_REASON_CODE = {
	PASS: "pass",
	FAIL: "fail",
	WARN: "warn",
	VALIDATION_OK: "VALIDATION_OK",
	RUC_INVALID: "RUC_INVALID",
	IGV_MISMATCH: "IGV_MISMATCH",
} as const;

export const PHASE_1_REQUIRED_ADR_IDS = [
	"ADR-030",
	"ADR-033",
	"ADR-034",
	"ADR-035",
] as const;

// Additional constants used across drenyra-pi
export const PI_VERSION = "0.1.0";
export const VALIDATION_OK = "VALIDATION_OK";
export const RUC_INVALID = "RUC_INVALID";
export const IGV_MISMATCH = "IGV_MISMATCH";
