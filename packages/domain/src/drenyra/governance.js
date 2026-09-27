export const DRENYRA_TOOL_RISK_LEVELS = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
];
export const DRENYRA_TOOL_APPROVAL_LEVELS = [
    "auto",
    "notify",
    "gate",
    "fiscal_gate",
];
function isSameFiscalScope(left, right) {
    return (left.companyId === right.companyId &&
        left.companyRuc === right.companyRuc &&
        left.organizationId === right.organizationId &&
        left.period === right.period &&
        left.countryCode === right.countryCode);
}
function requiresHumanApproval(manifest) {
    return (manifest.approvalLevel === "gate" ||
        manifest.approvalLevel === "fiscal_gate" ||
        manifest.riskLevel === "HIGH" ||
        manifest.riskLevel === "CRITICAL");
}
export function evaluateDrenyraToolGovernance(request) {
    const { manifest } = request;
    if (!manifest) {
        return { allowed: false, reason: "TOOL_NOT_REGISTERED" };
    }
    const scopeAllowed = manifest.allowedScopes.some((allowedScope) => isSameFiscalScope(allowedScope, request.scope));
    if (!scopeAllowed) {
        return { allowed: false, reason: "SCOPE_NOT_ALLOWED" };
    }
    if (manifest.redactionRequired && request.redactionStatus !== "passed") {
        return { allowed: false, reason: "REDACTION_FAILED" };
    }
    if (requiresHumanApproval(manifest) && !request.hasHumanApproval) {
        return { allowed: false, reason: "HUMAN_APPROVAL_REQUIRED" };
    }
    return { allowed: true, reason: "ALLOWED" };
}
//# sourceMappingURL=governance.js.map