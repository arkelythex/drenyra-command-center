import type { Agent, AgentResult, Task } from "../agents/types.js";
export declare class WorkerPool {
    private poolSize;
    private workers;
    private available;
    private tasks;
    private metrics;
    constructor(poolSize?: number);
    private initializeWorkers;
    private handleWorkerMessage;
    private replaceWorker;
    execute(task: Task, agent: Agent): Promise<AgentResult<unknown>>;
    private processQueue;
    getMetrics(): {
        poolSize: number;
        availableWorkers: number;
        pendingTasks: number;
        tasksExecuted: number;
        tasksFailed: number;
        avgExecutionTime: number;
    };
    terminate(): void;
}
//# sourceMappingURL=orchestrator-2026.worker-pool.d.ts.map