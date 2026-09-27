import type { AgentContext } from "../types/agent-context";
import type { AgentTool } from "../types/agent-tool";
import type { ApprovalRequest, GovernanceBundleResult } from "../types/approval-gate";
import type { ApprovalStore } from "./approval-store";
type ActionResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
export declare class ApprovalGateEngine {
    private store;
    private governanceValidator;
    private notifyCallback?;
    constructor(store: ApprovalStore, governanceValidator?: (toolName: string, input: unknown, context: AgentContext) => Promise<GovernanceBundleResult>, notifyCallback?: (request: ApprovalRequest) => Promise<void>);
    executeTool<TInput, TOutput>(tool: AgentTool<TInput, TOutput>, input: TInput, context: AgentContext): Promise<ActionResult<TOutput>>;
    approve(approvalId: string, reviewerId: string, reviewerRole: string): Promise<ActionResult<ApprovalRequest>>;
    reject(approvalId: string, reviewerId: string, rationale?: string): Promise<ActionResult<ApprovalRequest>>;
    getPendingApprovals(context?: AgentContext): ApprovalRequest[];
}
export {};
//# sourceMappingURL=approval-gate.d.ts.map