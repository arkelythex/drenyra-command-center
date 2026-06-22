import type { OpenRouterConfig, OpenRouterRequest, OpenRouterResponse, OpenRouterModel, OpenRouterTool, CostMetrics, StreamChunk } from './types.js';
export declare class OpenRouterService {
    private config;
    private costTracker;
    private modelCache;
    private lastFetch;
    constructor(config: OpenRouterConfig);
    chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse>;
    chatCompletionStream(request: OpenRouterRequest): AsyncGenerator<StreamChunk>;
    private calculateCostFromUsage;
    executeAgentTask(agentId: string, systemPrompt: string, userPrompt: string, tools?: OpenRouterTool[]): Promise<OpenRouterResponse>;
    private getHeaders;
    private makeRequest;
    fetchModels(): Promise<OpenRouterModel[]>;
    getModel(modelId: string): Promise<OpenRouterModel | undefined>;
    getCostMetrics(): CostMetrics;
    isWithinBudget(): boolean;
    getRecommendedModel(taskType: string): string;
    private sleep;
}
//# sourceMappingURL=client.d.ts.map