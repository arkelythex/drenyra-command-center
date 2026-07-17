import type { TaskDefinition, TaskResult } from "../kernel/types.js";
export interface AgentExecutor {
    id: string;
    type: string;
    capabilities: string[];
    execute(task: TaskDefinition): Promise<TaskResult>;
}
export interface OrchestratorMetrics {
    totalAgents: number;
    tasksExecuted: number;
    tasksFailed: number;
}
export type AggregationStrategy = "all-results" | "first-wins" | "consensus";
export declare class Orchestrator {
    private agents;
    private tasksExecuted;
    private tasksFailed;
    private isShutdown;
    registerAgent(agent: AgentExecutor): void;
    execute(task: TaskDefinition): Promise<TaskResult>;
    executeParallel(task: TaskDefinition, agentIds: string[], strategy?: AggregationStrategy): Promise<TaskResult[]>;
    shutdown(): void;
    getHealthMetrics(): OrchestratorMetrics;
    private findAgent;
    private failedResult;
    private aggregate;
}
//# sourceMappingURL=orchestrator.d.ts.map