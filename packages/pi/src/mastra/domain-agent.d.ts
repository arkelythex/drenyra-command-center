import type { AgentContext } from "../types/agent-context";
import type { LatinAgentId } from "../types/latin-agent";
export interface DomainResult {
    domainId: string;
    taskId: string;
    status: "completed" | "error" | "timeout";
    data: unknown;
    confidence: number;
    error?: {
        code: string;
        message: string;
        recoverable: boolean;
    };
}
export interface SubSwarmTask {
    id: string;
    goal: string;
    context: AgentContext;
    domain: LatinAgentId;
    tools?: string[];
    maxSteps?: number;
}
export interface SubAgentResult {
    subTaskId: string;
    status: "completed" | "error" | "timeout";
    data: unknown;
    confidence: number;
    error?: {
        code: string;
        message: string;
        recoverable: boolean;
    };
}
export interface MaterialAction {
    type: "financial" | "compliance" | "admin";
    amount?: number;
    currency?: string;
    description: string;
    toolName: string;
}
export interface ApprovalResult {
    required: boolean;
    approvalId?: string;
    reason?: string;
}
export interface EscalationContext {
    taskId: string;
    domain: LatinAgentId;
    reason: string;
    attempts: number;
    lastError?: string;
}
export interface EscalationResolution {
    action: "retry" | "bypass" | "abort" | "human";
    message: string;
    assignedTo?: string;
}
export interface DomainAgentConfig {
    id: LatinAgentId;
    name: string;
    description: string;
    capabilities: string[];
    approvalRequired: boolean;
    maxRetries: number;
}
export declare class DomainAgent {
    readonly id: LatinAgentId;
    readonly name: string;
    readonly description: string;
    readonly capabilities: string[];
    readonly primaryAgent: {
        id: string;
        name: string;
    };
    private readonly agents;
    private readonly config;
    constructor(agents: Array<{
        id: string;
        name: string;
    }>, config: DomainAgentConfig);
    selectBestAgent(task: {
        goal?: string;
        tools?: string[];
    }): {
        id: string;
        name: string;
    };
    receiveTask(task: {
        id: string;
        goal: string;
        context: AgentContext;
        tools?: string[];
    }): Promise<DomainResult>;
    spawnSubAgent(task: SubSwarmTask): Promise<SubAgentResult>;
    checkApproval(action: MaterialAction): Promise<ApprovalResult>;
    escalate(context: EscalationContext): Promise<EscalationResolution>;
}
//# sourceMappingURL=domain-agent.d.ts.map