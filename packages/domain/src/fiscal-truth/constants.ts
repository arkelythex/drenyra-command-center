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
	SUPPORTS: "supports",
	VALIDATES: "validates",
	APPROVES: "approves",
	DERIVES_FROM: "derives_from",
	GOVERNED_BY: "governed_by",
	PROMOTED_TO: "promoted_to",
} as const;

export const GOVERNANCE_REVIEW_STATUS = {
	APPROVED: "approved",
	REJECTED: "rejected",
	SUPERSEDED: "superseded",
} as const;

export const POLICY_OUTCOME = {
	BLOCKED: "blocked",
	APPROVAL_REQUIRED: "approval_required",
	PROMOTABLE: "promotable",
} as const;

export const REPLAY_FAILURE_CODE = {
	MISSING_EVIDENCE: "MISSING_EVIDENCE",
	HASH_MISMATCH: "HASH_MISMATCH",
	VALIDATOR_VERSION_MISSING: "VALIDATOR_VERSION_MISSING",
	POLICY_VERSION_MISSING: "POLICY_VERSION_MISSING",
	TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
} as const;

export const DETERMINISTIC_REASON_CODE = {
	VALIDATION_OK: "VALIDATION_OK",
	RUC_INVALID: "RUC_INVALID",
	IGV_MISMATCH: "IGV_MISMATCH",
} as const;

/**
 * Required ADR (Architecture Decision Record) references for Phase 1 governance.
 *
 * Every governance bundle submitted for authoritative promotion MUST include
 * these ADR IDs in its `adrIds` array. Without them, the governance check fails.
 */
export const PHASE_1_REQUIRED_ADR_IDS = [
	"ADR-019", // Fiscal Truth Boundary — append-only + evidence-linked
	"ADR-020", // Evidence Graph — fiscal ontology edges and promotion gates
] as const;
