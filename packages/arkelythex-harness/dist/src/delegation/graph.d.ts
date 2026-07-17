export type AgentTier = "tier0" | "tier1" | "tier2" | "tier3" | "tier3_nested";
export interface DelegationAgentNode {
    id: string;
    tier: AgentTier;
    label: string;
    maySpawn: readonly string[];
    requiresApproval?: boolean;
    parent?: string;
    leaf?: boolean;
}
export declare const MAX_DELEGATION_DEPTH = 3;
export declare const DELEGATION_AGENTS: Record<string, DelegationAgentNode>;
export declare function resolveRootAgentId(task: string): string;
export declare function getAgentNode(agentId: string): DelegationAgentNode | undefined;
export declare function canSpawn(parentId: string, childId: string): boolean;
//# sourceMappingURL=graph.d.ts.map