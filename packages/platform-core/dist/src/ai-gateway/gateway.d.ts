import type { LLMProvider, ChatMessage, TokenUsage } from "./provider.js";
import type { ModelRegistry } from "./registry.js";
import type { ToolRegistry } from "./tool-bridge.js";
export interface RateLimitConfig {
    maxRequestsPerMinute: number;
    maxTokensPerMinute: number;
}
export interface GatewayConfig {
    preferredProvider: string;
    fallbackProvider?: string;
    allowCrossProvider?: boolean;
    maxCostPerRequest?: number | null;
    rateLimits?: RateLimitConfig;
}
export interface GatewayRequest {
    messages: ChatMessage[];
    model?: string;
    capabilities?: string[];
    temperature?: number;
    maxTokens?: number;
}
export interface GatewayResult {
    content: string;
    model: string;
    provider: string;
    usage?: TokenUsage;
    cost?: number;
}
export interface GatewayMetrics {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    failoverCount: number;
    rateLimitedCount: number;
}
export interface AIGatewayOptions {
    modelRegistry: ModelRegistry;
    toolRegistry: ToolRegistry;
    defaultProvider: string;
    providers: Record<string, LLMProvider>;
    config: GatewayConfig;
}
export declare class AIGateway {
    private modelRegistry;
    private providers;
    private rateLimiter?;
    private isShutdown;
    private totalRequests;
    private totalTokens;
    private totalCost;
    private failoverCount;
    private rateLimitedCount;
    constructor(options: AIGatewayOptions);
    execute(request: GatewayRequest): Promise<GatewayResult>;
    executeWithTools(request: GatewayRequest): Promise<GatewayResult>;
    getMetrics(): GatewayMetrics;
    shutdown(): void;
    private estimateCost;
}
//# sourceMappingURL=gateway.d.ts.map