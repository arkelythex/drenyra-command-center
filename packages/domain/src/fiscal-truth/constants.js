export const TRUTH_EVENT_KIND = {
    AUTHORITATIVE_TRUTH_PROMOTED: "authoritative_truth_promoted",
    AUTHORITATIVE_TRUTH_REJECTED: "authoritative_truth_rejected",
};
export const EVIDENCE_NODE_KIND = {
    SOURCE_INPUT: "source_input",
    DETERMINISTIC_VALIDATION: "deterministic_validation",
    POLICY_DECISION: "policy_decision",
    APPROVAL: "approval",
    AI_SUGGESTION: "ai_suggestion",
};
export const EVIDENCE_EDGE_KIND = {
    SUPPORTS: "supports",
    VALIDATES: "validates",
    APPROVES: "approves",
    DERIVES_FROM: "derives_from",
    GOVERNED_BY: "governed_by",
    PROMOTED_TO: "promoted_to",
};
export const GOVERNANCE_REVIEW_STATUS = {
    APPROVED: "approved",
    REJECTED: "rejected",
    SUPERSEDED: "superseded",
};
export const POLICY_OUTCOME = {
    BLOCKED: "blocked",
    APPROVAL_REQUIRED: "approval_required",
    PROMOTABLE: "promotable",
};
export const REPLAY_FAILURE_CODE = {
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    VALIDATOR_VERSION_MISSING: "VALIDATOR_VERSION_MISSING",
    POLICY_VERSION_MISSING: "POLICY_VERSION_MISSING",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
};
export const DETERMINISTIC_REASON_CODE = {
    VALIDATION_OK: "VALIDATION_OK",
    RUC_INVALID: "RUC_INVALID",
    IGV_MISMATCH: "IGV_MISMATCH",
};
export const PHASE_1_REQUIRED_ADR_IDS = [
    "ADR-019",
    "ADR-020",
];
//# sourceMappingURL=constants.js.map