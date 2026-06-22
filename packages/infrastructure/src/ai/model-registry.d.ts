import type { LanguageModel } from "ai";
export type AIProvider = "google" | "anthropic" | "openai";
export type ModelTier = "flash" | "reasoning" | "opus";
export type TaskType = "ocr" | "extraction" | "classification" | "validation" | "correction" | "analysis" | "normative_reasoning" | "fraud_detection";
interface ModelDefinition {
    id: string;
    provider: AIProvider;
    tier: ModelTier;
    costPer1MInput: number;
    costPer1MOutput: number;
    contextWindow: number;
    available: boolean;
}
export declare const AVAILABLE_MODELS: Record<string, ModelDefinition>;
export declare const TASK_TIER_REQUIREMENTS: Record<TaskType, ModelTier>;
interface ModelSelectionConfig {
    preferredProvider: AIProvider;
    fallbackProvider: AIProvider;
    allowCrossProvider: boolean;
    maxCostPerRequest: number | null;
    preferSpeed: boolean;
}
export declare function configureModelSelection(config: Partial<ModelSelectionConfig>): void;
export declare function getModelSelectionConfig(): ModelSelectionConfig;
interface ModelSelection {
    model: LanguageModel;
    modelKey: string;
    definition: ModelDefinition;
    selectionReason: string;
}
export declare function selectModelForTask(task: TaskType): ModelSelection;
export declare function getModel(modelKey: string): LanguageModel;
export declare function getCheapestFlashModel(): ModelSelection;
export declare function getComplianceModel(): ModelSelection;
export declare function estimateCost(modelKey: string, inputTokens: number, outputTokens: number): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
};
export declare const modelFlash: import("@ai-sdk/provider").LanguageModelV3;
export declare const modelReasoning: import("@ai-sdk/provider").LanguageModelV3;
export declare const modelOpus: import("@ai-sdk/provider").LanguageModelV3;
export declare function getModelForTask(task: "OCR" | "EXTRACTION" | "VALIDATION" | "CORRECTION" | "ANALYSIS"): LanguageModel;
export interface OpenRouterModelTier {
    id: string;
    models: string[];
    maxTokens: number;
    temperature: number;
    costLimit: number;
}
export declare const OPENROUTER_MODEL_TIERS: Record<string, OpenRouterModelTier>;
export declare function getOpenRouterModelForTier(tierId: string): string;
export declare function getOpenRouterFallbackChain(tierId: string): string[];
export declare function getOpenRouterTierConfig(tierId: string): OpenRouterModelTier | null;
export {};
//# sourceMappingURL=model-registry.d.ts.map