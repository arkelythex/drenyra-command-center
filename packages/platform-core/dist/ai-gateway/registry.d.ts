export type ModelCapability = string;
export interface ModelCost {
    costPer1MInput: number;
    costPer1MOutput: number;
}
export interface RateLimits {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
}
export interface ModelRegistration {
    id: string;
    name: string;
    provider: string;
    capabilities: ModelCapability[];
    cost: ModelCost;
    rateLimits?: RateLimits;
    metadata?: Record<string, unknown>;
}
export declare class ModelRegistry {
    private models;
    register(model: ModelRegistration): void;
    get(id: string): ModelRegistration | undefined;
    list(): ModelRegistration[];
    selectByCapability(capabilities: ModelCapability[]): ModelRegistration[];
    remove(id: string): boolean;
}
//# sourceMappingURL=registry.d.ts.map