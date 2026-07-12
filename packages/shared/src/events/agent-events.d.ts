export interface AgentEventBase {
    id: string;
    runId: string;
    timestamp: number;
}
export interface RunStartedEvent extends AgentEventBase {
    type: "run_started";
    payload: {
        runId: string;
        startedAt: number;
        config?: Record<string, unknown>;
    };
}
export interface ThinkingEvent extends AgentEventBase {
    type: "thinking";
    payload: {
        content: string;
        agentId: string;
    };
}
export interface ToolCallEvent extends AgentEventBase {
    type: "tool_call";
    payload: {
        toolName: string;
        args: Record<string, unknown>;
        callId: string;
    };
}
export interface ToolResultEvent extends AgentEventBase {
    type: "tool_result";
    payload: {
        toolName: string;
        callId: string;
        result: unknown;
        duration: number;
    };
}
export interface ToolErrorEvent extends AgentEventBase {
    type: "tool_error";
    payload: {
        toolName: string;
        callId: string;
        error: string;
    };
}
export interface ProgressEvent extends AgentEventBase {
    type: "progress";
    payload: {
        progress: number;
        status: string;
        detail?: string;
    };
}
export interface ApprovalRequiredEvent extends AgentEventBase {
    type: "approval_required";
    payload: {
        approvalId: string;
        toolName: string;
        args: Record<string, unknown>;
        risk: "low" | "medium" | "high";
        reason: string;
    };
}
export interface ApprovalDecisionEvent extends AgentEventBase {
    type: "approval_decision";
    payload: {
        approvalId: string;
        decision: "approved" | "denied";
        reason?: string;
    };
}
export interface UsageEvent extends AgentEventBase {
    type: "usage";
    payload: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        modelId: string;
    };
}
export interface CompleteEvent extends AgentEventBase {
    type: "complete";
    payload: {
        result: unknown;
        duration: number;
        toolCalls: number;
    };
}
export interface ErrorEvent extends AgentEventBase {
    type: "error";
    payload: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export type AgentEvent = RunStartedEvent | ThinkingEvent | ToolCallEvent | ToolResultEvent | ToolErrorEvent | ProgressEvent | ApprovalRequiredEvent | ApprovalDecisionEvent | UsageEvent | CompleteEvent | ErrorEvent;
export type AgentEventType = AgentEvent["type"];
//# sourceMappingURL=agent-events.d.ts.map