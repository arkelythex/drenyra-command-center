export const DFAS_PROTOCOL_VERSION = "1.0.0";
export const DFAS_ORCHESTRATION_MODE = {
    TRANSACTION: "transaction",
    PERIOD: "period",
    AUTO: "auto",
};
export const DFAS_APPROVAL_DECISION = {
    ALLOW: "allow",
    DENY: "deny",
    CANCEL: "cancel",
};
export const DFAS_TURN_STATUS = {
    QUEUED: "queued",
    RUNNING: "running",
    WAITING_FOR_APPROVAL: "waiting_for_approval",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
};
export const DFAS_THREAD_STATUS = {
    ACTIVE: "active",
    WAITING_FOR_APPROVAL: "waiting_for_approval",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
    ARCHIVED: "archived",
};
export const DFAS_ITEM_TYPE = {
    USER_MESSAGE: "user_message",
    ASSISTANT_MESSAGE: "assistant_message",
    EVIDENCE: "evidence",
    GATE: "gate",
    ENVELOPE: "envelope",
    CAPABILITY_DECISION: "capability_decision",
    APPROVAL_REQUIRED: "approval_required",
    APPROVAL_RESOLVED: "approval_resolved",
    TRUTH_PROMOTED: "truth_promoted",
    AGENT_DELEGATION: "agent_delegation",
    ERROR: "error",
};
export const DFAS_ERROR_CODE = {
    SCOPE_INVALID: "DRENYRA_SCOPE_INVALID",
    SCOPE_MISMATCH: "DRENYRA_SCOPE_MISMATCH",
    THREAD_NOT_FOUND: "DRENYRA_THREAD_NOT_FOUND",
    TURN_IN_PROGRESS: "DRENYRA_TURN_IN_PROGRESS",
    CAPABILITY_DENIED: "DRENYRA_CAPABILITY_DENIED",
    APPROVAL_EXPIRED: "DRENYRA_APPROVAL_EXPIRED",
    PROTOCOL_VERSION: "DRENYRA_PROTOCOL_VERSION",
};
export function isValidDfasFiscalScope(scope) {
    if (!scope.companyId?.trim())
        return false;
    if (!scope.companyRuc?.match(/^\d{11}$/))
        return false;
    if (!scope.period?.match(/^\d{4}-(0[1-9]|1[0-2])$/))
        return false;
    if (scope.countryCode !== "PE")
        return false;
    return true;
}
export function dfasScopesMatch(a, b) {
    return (a.companyId === b.companyId &&
        a.companyRuc === b.companyRuc &&
        a.period === b.period &&
        a.countryCode === b.countryCode &&
        (a.organizationId ?? "") === (b.organizationId ?? ""));
}
//# sourceMappingURL=dfas-protocol-types.js.map