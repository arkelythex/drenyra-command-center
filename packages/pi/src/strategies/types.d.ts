import type { AgentContext } from "../types/agent-context";
export type AnomalySeverity = "low" | "medium" | "high" | "critical";
export interface Anomaly {
    id: string;
    timestamp: string;
    entityType: string;
    entityId: string;
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    severity: AnomalySeverity;
    confidence: number;
    reasoning: string;
    detectionMethod: string;
    context: Record<string, unknown>;
}
export interface AnomalyStrategy {
    id: string;
    name: string;
    description: string;
    minSeverity?: AnomalySeverity;
    execute(data: unknown, context: AgentContext): Anomaly[] | Promise<Anomaly[]>;
}
export interface StrategyRunResult {
    strategyId: string;
    strategyName: string;
    anomalies: Anomaly[];
    durationMs: number;
    error?: string;
}
export interface FiscalAnomalyEngineOptions {
    publishThreshold?: AnomalySeverity;
    publishToEventBus?: boolean;
    trackPerformance?: boolean;
}
export declare function compareSeverity(a: AnomalySeverity, b: AnomalySeverity): number;
export declare function meetsThreshold(anomaly: Anomaly, threshold?: AnomalySeverity): boolean;
//# sourceMappingURL=types.d.ts.map