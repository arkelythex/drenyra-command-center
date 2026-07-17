import type { TaskDefinition } from "../kernel/types.js";
export type TaskExecutor = () => Promise<unknown>;
export interface WorkerPoolConfig {
    maxWorkers?: number;
    queueCapacity?: number;
}
export interface WorkerPoolMetrics {
    maxWorkers: number;
    activeWorkers: number;
    queuedTasks: number;
    tasksExecuted: number;
    tasksFailed: number;
}
export declare class WorkerPool {
    private readonly maxWorkers;
    private readonly queueCapacity;
    private activeCount;
    private tasksExecuted;
    private tasksFailed;
    private shutdownRequested;
    private queue;
    constructor(config?: WorkerPoolConfig);
    execute(_task: TaskDefinition, executor: TaskExecutor): Promise<unknown>;
    private processQueue;
    private executeTask;
    getMetrics(): WorkerPoolMetrics;
    shutdown(): void;
}
//# sourceMappingURL=worker-pool.d.ts.map