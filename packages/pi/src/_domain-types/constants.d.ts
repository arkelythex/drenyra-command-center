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
    readonly PROVES: "proves";
    readonly REFERENCES: "references";
    readonly DEPENDS_ON: "depends_on";
};
export declare const GOVERNANCE_REVIEW_STATUS: {
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
    readonly WAIVED: "waived";
};
export declare const POLICY_OUTCOME: {
    readonly ALLOWED: "allowed";
    readonly DENIED: "denied";
    readonly REVIEW: "review";
};
export declare const REPLAY_FAILURE_CODE: {
    readonly VERSION_MISMATCH: "version_mismatch";
    readonly MISSING_TRACE: "missing_trace";
    readonly HASH_MISMATCH: "hash_mismatch";
    readonly PERMISSION_CHANGED: "permission_changed";
};
export declare const DETERMINISTIC_REASON_CODE: {
    readonly PASS: "pass";
    readonly FAIL: "fail";
    readonly WARN: "warn";
    readonly VALIDATION_OK: "VALIDATION_OK";
    readonly RUC_INVALID: "RUC_INVALID";
    readonly IGV_MISMATCH: "IGV_MISMATCH";
};
export declare const PHASE_1_REQUIRED_ADR_IDS: readonly ["ADR-030", "ADR-033", "ADR-034", "ADR-035"];
export declare const PI_VERSION = "0.1.0";
export declare const VALIDATION_OK = "VALIDATION_OK";
export declare const RUC_INVALID = "RUC_INVALID";
export declare const IGV_MISMATCH = "IGV_MISMATCH";
//# sourceMappingURL=constants.d.ts.map