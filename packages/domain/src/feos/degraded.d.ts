import type { Timestamp } from "./types";
export type ServiceStatus = "operational" | "degraded" | "down" | "unknown";
export interface ServiceHealth {
    serviceName: string;
    status: ServiceStatus;
    lastCheck: Timestamp;
    responseTimeMs?: number;
    errorRate?: number;
    message?: string;
}
export type CircuitState = "closed" | "open" | "half_open";
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenSuccessThreshold: number;
}
export declare const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig;
export interface CircuitBreakerState {
    name: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureAt?: Timestamp;
    lastSuccessAt?: Timestamp;
    openedAt?: Timestamp;
    config: CircuitBreakerConfig;
}
export declare class CircuitBreaker {
    private state;
    constructor(name: string, config?: Partial<CircuitBreakerConfig>);
    get name(): string;
    get currentState(): CircuitState;
    get failureCount(): number;
    allowsRequest(): boolean;
    recordSuccess(): void;
    recordFailure(): void;
    reset(): void;
    toJSON(): CircuitBreakerState;
}
export interface CapabilityStatus {
    capability: string;
    status: ServiceStatus;
    circuitBreaker: CircuitBreakerState;
    lastChecked: Timestamp;
    degradedMessage?: string;
    recoveryProcedure?: string;
    fallbackCapability?: string;
}
export interface DegradedModeConfig {
    active: boolean;
    degradedCapabilities: string[];
    downCapabilities: string[];
    message: string;
    since: Timestamp;
    recoveryEta?: Timestamp;
    escalationContact?: string;
    runbookUrl?: string;
}
export interface UnknownStateResolution {
    workspaceId: string;
    detectedAt: Timestamp;
    resolution: "rediscovered" | "failed" | "requires_manual_intervention";
    resolvedAt?: Timestamp;
    resolutionNotes?: string;
    evidence?: string;
}
export declare function generateRecoveryPlan(workspaceId: string, capabilities: string[]): string[];
export interface DegradedModeStore {
    getConfig(organizationId: string, companyId?: string): Promise<DegradedModeConfig | null>;
    setConfig(config: DegradedModeConfig): Promise<void>;
    getServiceHealth(serviceName: string): Promise<ServiceHealth | null>;
    updateServiceHealth(health: ServiceHealth): Promise<void>;
    listDegraded(organizationId: string): Promise<CapabilityStatus[]>;
}
//# sourceMappingURL=degraded.d.ts.map