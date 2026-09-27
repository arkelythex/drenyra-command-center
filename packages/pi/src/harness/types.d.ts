import type { ApprovalWorkflow, DelegationGraph, HarnessAgentResult, HarnessExecutionContext, HarnessRunNode, HarnessSpawnRequest, HarnessStatus } from "../harness-core";
export interface HarnessExecuteResponse {
    traceId: string;
    rootAgentId: string;
    status: HarnessStatus;
    tree: HarnessRunNode;
    executiveSummary: string;
}
export type AgentHandler = (input: HarnessSpawnRequest & {
    runId: string;
}) => Promise<HarnessAgentResult>;
export interface HarnessOptions {
    maxDepth?: number;
    handlers?: Map<string, AgentHandler>;
    onApprovalRequired?: (input: {
        agentId: string;
        task: string;
        context: HarnessExecutionContext;
        runId: string;
    }) => Promise<boolean>;
    delegationGraph?: DelegationGraph;
    approvalWorkflow?: ApprovalWorkflow;
}
//# sourceMappingURL=types.d.ts.map