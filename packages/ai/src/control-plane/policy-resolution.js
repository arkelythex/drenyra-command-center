const SCOPE_MISMATCH = "scope-mismatch";
const CAPABILITY_NOT_ALLOWED = "capability-not-allowed";
const TOOL_WILDCARD_BLOCKED = "tool-wildcard-blocked";
const TOOL_NOT_ALLOWED = "tool-not-allowed";
const DEFAULT_FALLBACK_MODE = "deterministic-required";
export const lookupAllowedToolsForCapability = ({ registryEntry, requestedCapability, capabilityToolMatrix, }) => {
    const declaredByCapability = capabilityToolMatrix?.[requestedCapability];
    if (declaredByCapability && declaredByCapability.length > 0) {
        return registryEntry.allowedTools.filter((tool) => declaredByCapability.includes(tool));
    }
    return [...registryEntry.allowedTools];
};
export const resolvePolicyDecision = ({ traceId, registryEntry, requestedScope, requestedCapability, requestedTool, capabilityToolMatrix, }) => {
    const violations = [];
    if (!scopeMatches(registryEntry.tenantScope, requestedScope)) {
        violations.push(SCOPE_MISMATCH);
    }
    if (!registryEntry.capabilities.includes(requestedCapability)) {
        violations.push(CAPABILITY_NOT_ALLOWED);
    }
    if (requestedTool === "*") {
        violations.push(TOOL_WILDCARD_BLOCKED);
    }
    const allowedTools = lookupAllowedToolsForCapability({
        registryEntry,
        requestedCapability,
        capabilityToolMatrix,
    });
    if (!allowedTools.includes(requestedTool)) {
        violations.push(TOOL_NOT_ALLOWED);
    }
    const allowed = violations.length === 0;
    return {
        traceId,
        tenantScope: requestedScope,
        allowed,
        fallbackMode: allowed ? "allow-advisory" : DEFAULT_FALLBACK_MODE,
        violations,
        approvalState: "validated",
        authoritativeMutationAllowed: false,
    };
};
export const canHandoffToDeterministicFlow = ({ approvalState, decisionAllowed, }) => {
    if (!decisionAllowed) {
        return false;
    }
    return approvalState === "approved";
};
export const scopeMatches = (left, right) => {
    return (left.tenantId === right.tenantId &&
        left.organizationId === right.organizationId &&
        left.companyId === right.companyId &&
        left.ruc === right.ruc);
};
//# sourceMappingURL=policy-resolution.js.map