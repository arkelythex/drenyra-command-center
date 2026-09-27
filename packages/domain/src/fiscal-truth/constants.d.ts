export declare const TRUTH_EVENT_KIND: {
    readonly AUTHORITATIVE_TRUTH_PROMOTED: "authoritative_truth_promoted";
    readonly AUTHORITATIVE_TRUTH_REJECTED: "authoritative_truth_rejected";
};
export declare const EVIDENCE_NODE_KIND: {
    readonly SOURCE_INPUT: "source_input";
    readonly DETERMINISTIC_VALIDATION: "deterministic_validation";
    readonly POLICY_DECISION: "policy_decision";
    readonly APPROVAL: "approval";
    readonly AI_SUGGESTION: "ai_suggestion";
};
export declare const EVIDENCE_EDGE_KIND: {
    readonly SUPPORTS: "supports";
    readonly VALIDATES: "validates";
    readonly APPROVES: "approves";
    readonly DERIVES_FROM: "derives_from";
    readonly GOVERNED_BY: "governed_by";
    readonly PROMOTED_TO: "promoted_to";
};
export declare const GOVERNANCE_REVIEW_STATUS: {
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
    readonly SUPERSEDED: "superseded";
};
export declare const POLICY_OUTCOME: {
    readonly BLOCKED: "blocked";
    readonly APPROVAL_REQUIRED: "approval_required";
    readonly PROMOTABLE: "promotable";
};
export declare const REPLAY_FAILURE_CODE: {
    readonly MISSING_EVIDENCE: "MISSING_EVIDENCE";
    readonly HASH_MISMATCH: "HASH_MISMATCH";
    readonly VALIDATOR_VERSION_MISSING: "VALIDATOR_VERSION_MISSING";
    readonly POLICY_VERSION_MISSING: "POLICY_VERSION_MISSING";
    readonly TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION";
};
export declare const DETERMINISTIC_REASON_CODE: {
    readonly VALIDATION_OK: "VALIDATION_OK";
    readonly RUC_INVALID: "RUC_INVALID";
    readonly IGV_MISMATCH: "IGV_MISMATCH";
};
export declare const PHASE_1_REQUIRED_ADR_IDS: readonly ["ADR-019", "ADR-020"];
//# sourceMappingURL=constants.d.ts.map