import type { Agent, AgentResult, Task } from "../agents/types.js";
export type { Agent, AgentResult, Task } from "../agents/types.js";
export interface OrchestrationStrategy {
    type: "parallel" | "sequential" | "adaptive" | "router-based";
    maxConcurrency: number;
    timeout: number;
    retryFailedAgents: boolean;
    aggregationStrategy: "weighted-voting" | "consensus" | "first-wins" | "all-results";
}
export interface OrchestrationContext {
    traceId: string;
    startTime: Date;
    strategy: OrchestrationStrategy;
    agents: string[];
    results: AgentResult[];
    errors: Error[];
}
export declare class AgentOrchestrator {
    private workerPool;
    private agentRegistry;
    private messageBus;
    private doraMetrics;
    private eventEmitter;
    constructor(workerPoolSize?: number);
    registerAgent(agent: Agent): void;
    executeParallel(task: Task, agentIds: string[], strategy?: OrchestrationStrategy["aggregationStrategy"]): Promise<AgentResult<unknown>[]>;
    decomposeAndExecute(complexTask: Task): Promise<AgentResult<unknown>[]>;
    private autoDecompose;
    private aggregateResults;
    coordinate(agentIds: string[], task: Task): Promise<AgentResult<unknown>[]>;
    getDoraMetrics(): {
        deploymentFrequency: {
            daily: number;
            weekly: number;
        };
        leadTimeForChanges: {
            avg: number;
            median: number;
        };
        changeFailureRate: number;
        meanTimeToRecovery: {
            avg: number;
        };
    };
    getHealthMetrics(): {
        workerPool: {
            poolSize: number;
            availableWorkers: number;
            pendingTasks: number;
            tasksExecuted: number;
            tasksFailed: number;
            avgExecutionTime: number;
        };
        dora: {
            deploymentFrequency: {
                daily: number;
                weekly: number;
            };
            leadTimeForChanges: {
                avg: number;
                median: number;
            };
            changeFailureRate: number;
            meanTimeToRecovery: {
                avg: number;
            };
        };
    };
    shutdown(): void;
}
export declare function createOrchestrator(options?: {
    workerPoolSize?: number;
}): AgentOrchestrator;
export declare const orchestrator: AgentOrchestrator;
//# sourceMappingURL=orchestrator-2026.d.ts.map