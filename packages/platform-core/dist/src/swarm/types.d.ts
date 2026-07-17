export interface OrchestratorConfig {
    maxConcurrency?: number;
    defaultTimeout?: number;
    retryFailedAgents?: boolean;
}
export interface WorkerPoolConfig {
    maxWorkers: number;
    queueCapacity?: number;
    idleTimeoutMs?: number;
}
export interface RouterConfig {
    defaultAgentType?: string;
    enableDoraRouting?: boolean;
    maxRoutingDepth?: number;
}
//# sourceMappingURL=types.d.ts.map