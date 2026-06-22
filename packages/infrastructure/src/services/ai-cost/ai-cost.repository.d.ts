import { type AiCostEvent } from "@arkelythex/persistence/schema";
export interface CostEventInput {
    agentType: string;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
    taskId?: string;
    organizationId?: number;
    wasBlocked?: boolean;
    blockReason?: string;
}
export interface CostSummary {
    daily: {
        spent: number;
        limit: number;
        remaining: number;
        percentage: number;
    };
    monthly: {
        spent: number;
        limit: number;
        remaining: number;
        percentage: number;
    };
    byAgent: Record<string, {
        calls: number;
        totalCost: number;
        avgCostPerCall: number;
    }>;
    trend: Array<{
        date: string;
        spent: number;
        calls: number;
    }>;
    topModels: Array<{
        model: string;
        calls: number;
        totalCost: number;
    }>;
    totalEvents: number;
}
export declare const aiCostRepository: {
    record(input: CostEventInput): Promise<void>;
    getSummary(organizationId?: number): Promise<CostSummary>;
    getRecent(limit?: number, organizationId?: number): Promise<AiCostEvent[]>;
};
//# sourceMappingURL=ai-cost.repository.d.ts.map