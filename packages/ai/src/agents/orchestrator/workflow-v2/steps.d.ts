import type { AgentMetrics } from "./types";
declare class CircuitBreaker {
    private threshold;
    private timeoutMs;
    private failures;
    private lastFailureTime?;
    private state;
    constructor(threshold: number, timeoutMs: number);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): "CLOSED" | "OPEN" | "HALF_OPEN";
}
declare class AgentMetricsCollector {
    private metrics;
    startAgent(agentName: string): AgentMetrics;
    finishAgent(metric: AgentMetrics, status: "success" | "failed" | "timeout", error?: Error): void;
    getMetrics(agentName?: string): AgentMetrics[] | Map<string, AgentMetrics[]>;
    getSuccessRate(agentName: string): number;
    getAverageProcessingTime(agentName: string): number;
}
export { AgentMetricsCollector, CircuitBreaker };
//# sourceMappingURL=steps.d.ts.map