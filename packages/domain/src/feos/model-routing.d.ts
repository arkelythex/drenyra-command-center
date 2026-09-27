import type { ToolRiskLevel } from "./tool-contract";
export type AIProvider = "google" | "anthropic" | "openai" | "deepseek" | "grok" | "openrouter";
export type ModelTier = "flash" | "reasoning" | "opus";
export interface ModelCapabilities {
    supportsConstrainedOutput: boolean;
    supportsJsonSchema: boolean;
    supportsToolCalling: boolean;
    supportsStreaming: boolean;
    supportsVision: boolean;
    contextWindow: number;
    maxOutputTokens: number;
}
export interface ModelPricing {
    costPer1MInput: number;
    costPer1MOutput: number;
    currency: string;
}
export interface ModelEntry {
    id: string;
    provider: AIProvider;
    tier: ModelTier;
    capabilities: ModelCapabilities;
    pricing: ModelPricing;
    available: boolean;
    tags: string[];
}
export interface CostEntry {
    modelId: string;
    provider: AIProvider;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    currency: string;
    workspaceId?: string;
    traceId: string;
    timestamp: string;
    toolName?: string;
}
export interface CostBudget {
    maxPerWorkspace: number;
    maxPerCompany: number;
    currentWorkspaceCosts: Map<string, number>;
    currentCompanyCost: number;
}
export interface RoutingDecision {
    selectedModel: string;
    provider: AIProvider;
    tier: ModelTier;
    estimatedCost: number;
    reasoning: string;
    alternatives: string[];
}
export declare const DRENYRA_MODEL_REGISTRY: ModelEntry[];
export declare class ModelRouter {
    private registry;
    private costTracker;
    constructor(entries?: ModelEntry[]);
    getModel(id: string): ModelEntry | undefined;
    listAvailable(): ModelEntry[];
    route(input: {
        riskLevel: ToolRiskLevel;
        taskType: string;
        requiredCapabilities?: string[];
        budget?: CostBudget;
        workspaceId?: string;
    }): RoutingDecision;
    trackCost(entry: Omit<CostEntry, "timestamp">): CostEntry;
    getWorkspaceCost(workspaceId: string): number;
    getTotalCost(): number;
}
//# sourceMappingURL=model-routing.d.ts.map