export type CBState = "CLOSED" | "OPEN" | "HALF_OPEN";
export declare class PersistentCircuitBreaker {
    private memory;
    private state;
    private cacheTimestamp;
    private persistedState;
    private readonly CACHE_TTL;
    constructor(agentName: string, scope: "agent" | "provider", threshold?: number, timeoutMs?: number);
    isAvailable(): Promise<boolean>;
    recordSuccess(): Promise<void>;
    recordFailure(): Promise<void>;
    getState(): CBState;
    private resolveState;
    private syncFromDb;
    private persistToDb;
}
//# sourceMappingURL=persistent-circuit-breaker.d.ts.map