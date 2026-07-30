export type AgentType = string;
export type AgentStatus = "idle" | "busy" | "error" | "completed" | "offline";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "assigned" | "in_progress" | "completed" | "failed" | "cancelled";
export interface TaskDefinition {
    id: string;
    type: AgentType;
    priority: TaskPriority;
    input: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    maxRetries?: number;
    timeout?: number;
}
export interface TaskResult {
    taskId: string;
    status: TaskStatus;
    output?: Record<string, unknown>;
    error?: string;
    startedAt: string;
    completedAt?: string;
    attempts: number;
}
export interface AgentContext {
    agentId: string;
    type: AgentType;
    status: AgentStatus;
    capabilities: string[];
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map