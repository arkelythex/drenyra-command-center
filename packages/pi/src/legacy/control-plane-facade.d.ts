import type { AgentContext, GovernanceBundleResult } from "../types/index";
export interface CompatibilityScope {
    tenantId: string;
    organizationId: string;
    companyId: string;
    ruc: string;
}
export interface CompatibilityRegistryEntry {
    agentId: string;
}
export interface LegacyPolicyPreviewInput {
    traceId: string;
    registryEntry: CompatibilityRegistryEntry;
    tenantId: string;
    organizationId: string;
    companyId: string;
    ruc: string;
    requestedCapability: string;
    requestedTool: string;
}
export interface LegacyCapabilityToolsLookupInput {
    registryEntry: CompatibilityRegistryEntry;
    requestedCapability: string;
}
export interface NormalizedLegacyPolicyPreview {
    traceId: string;
    agentId: string;
    requestedScope: CompatibilityScope;
    requestedCapability: string;
    requestedTool: string;
}
export interface NormalizedLegacyCapabilityToolsLookup {
    agentId: string;
    requestedCapability: string;
}
export declare const normalizeLegacyPolicyPreviewInput: (input: LegacyPolicyPreviewInput) => NormalizedLegacyPolicyPreview;
export declare const normalizeLegacyCapabilityToolsLookup: ({ registryEntry, requestedCapability, }: LegacyCapabilityToolsLookupInput) => NormalizedLegacyCapabilityToolsLookup;
export declare function createGovernanceValidator(): (toolName: string, input: unknown, context: AgentContext) => Promise<GovernanceBundleResult>;
//# sourceMappingURL=control-plane-facade.d.ts.map