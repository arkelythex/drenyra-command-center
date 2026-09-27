import { ApprovalWorkflow, DelegationGraph } from "../harness-core";
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
import type { HarnessExecuteRequest, HarnessRunNode, HarnessSpawnRequest } from "../harness-core";
import type { AgentHandler, HarnessExecuteResponse, HarnessOptions } from "./types.js";
export declare function createDefaultDelegationGraph(): DelegationGraph;
export declare function createDefaultApprovalWorkflow(): ApprovalWorkflow;
export declare class DrenyraHarness {
    private readonly maxDepth;
    private readonly handlers;
    private readonly onApprovalRequired?;
    private readonly delegationGraph;
    private readonly approvalWorkflow;
    constructor(options?: HarnessOptions);
    registerHandler(agentId: string, handler: AgentHandler): void;
    getRegisteredAgents(): string[];
    canSpawnAgent(parentId: string, childId: string, depth: number): boolean;
    execute(request: HarnessExecuteRequest): Promise<HarnessExecuteResponse>;
    spawn(request: HarnessSpawnRequest): Promise<HarnessRunNode>;
    private runSpawnChildren;
    private run;
    private blockedNode;
}
export declare function createDrenyraHarness(options?: HarnessOptions): DrenyraHarness;
//# sourceMappingURL=harness.d.ts.map