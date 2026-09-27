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
    PROVES: "proves",
    REFERENCES: "references",
    DEPENDS_ON: "depends_on",
};
export const GOVERNANCE_REVIEW_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    WAIVED: "waived",
};
export const POLICY_OUTCOME = {
    ALLOWED: "allowed",
    DENIED: "denied",
    REVIEW: "review",
};
export const REPLAY_FAILURE_CODE = {
    VERSION_MISMATCH: "version_mismatch",
    MISSING_TRACE: "missing_trace",
    HASH_MISMATCH: "hash_mismatch",
    PERMISSION_CHANGED: "permission_changed",
};
export const DETERMINISTIC_REASON_CODE = {
    PASS: "pass",
    FAIL: "fail",
    WARN: "warn",
    VALIDATION_OK: "VALIDATION_OK",
    RUC_INVALID: "RUC_INVALID",
    IGV_MISMATCH: "IGV_MISMATCH",
};
export const PHASE_1_REQUIRED_ADR_IDS = [
    "ADR-030",
    "ADR-033",
    "ADR-034",
    "ADR-035",
];
export const PI_VERSION = "0.1.0";
export const VALIDATION_OK = "VALIDATION_OK";
export const RUC_INVALID = "RUC_INVALID";
export const IGV_MISMATCH = "IGV_MISMATCH";
//# sourceMappingURL=constants.js.map