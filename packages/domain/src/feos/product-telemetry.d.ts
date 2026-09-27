import type { Timestamp } from "./types";
export type TelemetryCategory = "feature_usage" | "performance" | "error" | "workflow" | "agent" | "cost";
export interface TelemetryEvent {
    id: string;
    category: TelemetryCategory;
    name: string;
    value?: number;
    tags: string[];
    durationMs?: number;
    metadata?: Record<string, unknown>;
    workspaceId?: string;
    sessionId?: string;
    timestamp: Timestamp;
}
export interface CostMetric {
    metric: string;
    value: number;
    unit: string;
    period: string;
    workspaceId?: string;
    companyId?: string;
}
export declare function emptyCostMetrics(period: string): CostMetric[];
export interface UsageMetric {
    feature: string;
    action: string;
    count: number;
    uniqueUsers: number;
    period: string;
}
export declare class TelemetryStore {
    private events;
    private metrics;
    record(event: Omit<TelemetryEvent, "id" | "timestamp">): TelemetryEvent;
    recordCost(metric: CostMetric): void;
    getEvents(category?: TelemetryCategory, limit?: number): TelemetryEvent[];
    getCostMetrics(period: string): CostMetric[];
    aggregateCost(period: string): CostMetric[];
}
//# sourceMappingURL=product-telemetry.d.ts.map