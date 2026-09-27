export const normalizeLegacyPolicyPreviewInput = (input) => ({
    traceId: input.traceId,
    agentId: input.registryEntry.agentId,
    requestedScope: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        companyId: input.companyId,
        ruc: input.ruc,
    },
    requestedCapability: input.requestedCapability,
    requestedTool: input.requestedTool,
});
export const normalizeLegacyCapabilityToolsLookup = ({ registryEntry, requestedCapability, }) => ({
    agentId: registryEntry.agentId,
    requestedCapability,
});
export function createGovernanceValidator() {
    return async (toolName, input, context) => {
        return {
            valid: true,
            reasons: [],
            evidenceRefs: [],
        };
    };
}
//# sourceMappingURL=control-plane-facade.js.map