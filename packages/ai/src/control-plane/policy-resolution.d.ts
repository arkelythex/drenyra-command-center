import type { AgentCapability, AgentRegistryEntry, ApprovalState, PolicyDecision, TenantCompanyRucScope } from "./contracts";
type CapabilityToolMatrix = Partial<Record<AgentCapability, readonly string[]>>;
export interface ResolvePolicyDecisionInput {
    traceId: string;
    registryEntry: AgentRegistryEntry;
    requestedScope: TenantCompanyRucScope;
    requestedCapability: AgentCapability;
    requestedTool: string;
    capabilityToolMatrix?: CapabilityToolMatrix;
}
export interface LookupAllowedToolsInput {
    registryEntry: AgentRegistryEntry;
    requestedCapability: AgentCapability;
    capabilityToolMatrix?: CapabilityToolMatrix;
}
export interface DeterministicHandoffGuardInput {
    approvalState: ApprovalState;
    decisionAllowed: boolean;
}
export declare const lookupAllowedToolsForCapability: ({ registryEntry, requestedCapability, capabilityToolMatrix, }: LookupAllowedToolsInput) => string[];
export declare const resolvePolicyDecision: ({ traceId, registryEntry, requestedScope, requestedCapability, requestedTool, capabilityToolMatrix, }: ResolvePolicyDecisionInput) => PolicyDecision;
export declare const canHandoffToDeterministicFlow: ({ approvalState, decisionAllowed, }: DeterministicHandoffGuardInput) => boolean;
export declare const scopeMatches: (left: TenantCompanyRucScope, right: TenantCompanyRucScope) => boolean;
export {};
//# sourceMappingURL=policy-resolution.d.ts.map