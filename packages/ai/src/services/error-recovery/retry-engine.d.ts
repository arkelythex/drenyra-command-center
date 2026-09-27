import type { AgentError } from "./agent-error";
export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    useJitter: boolean;
    retryableErrors: ("TRANSIENT" | "UNKNOWN")[];
}
export declare class RetryEngine {
    private dlqRepo;
    constructor();
    executeWithRetry<T>(fn: () => Promise<T>, context: {
        agentName: string;
        runId: string;
        workflowState?: string;
        input?: unknown;
    }, config?: Partial<RetryConfig>): Promise<{
        result?: T;
        error?: AgentError;
        retries: number;
    }>;
    enqueueForRetry(runId: string, agentName: string, error: AgentError, workflowState?: string, batchId?: string, _input?: unknown): Promise<void>;
    processPendingRetries(limit?: number): Promise<number>;
    processPendingItems<T>(limit?: number, processor?: (item: {
        id: string;
        runId: string;
        agentName: string;
        input?: unknown;
    }) => Promise<T>): Promise<number>;
    calculateDelay(attempt: number, config: RetryConfig): number;
    private sleep;
}
//# sourceMappingURL=retry-engine.d.ts.map