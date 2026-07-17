export interface ProviderConfig {
    name: string;
    baseUrl?: string;
    apiKey?: string;
    maxRetries?: number;
}
export interface ModelConfig {
    id: string;
    provider: string;
    tier: "flash" | "reasoning" | "opus";
    costPer1MInput: number;
    costPer1MOutput: number;
    contextWindow: number;
}
export interface GatewayConfig {
    preferredProvider: string;
    fallbackProvider?: string;
    allowCrossProvider?: boolean;
    maxCostPerRequest?: number | null;
}
//# sourceMappingURL=types.d.ts.map