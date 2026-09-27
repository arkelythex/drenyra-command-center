import type { Timestamp } from "./types";
export type ConnectorCategory = "tax_authority" | "bank" | "erp" | "document" | "payment" | "identity_provider";
export type ConnectorAuthType = "api_key" | "oauth2" | "basic" | "certificate" | "none";
export type ConnectorStatus = "active" | "inactive" | "error" | "deprecated";
export interface ConnectorContract {
    id: string;
    name: string;
    provider: string;
    category: ConnectorCategory;
    version: string;
    authType: ConnectorAuthType;
    baseUrl: string;
    capabilities: string[];
    supportedCountries: string[];
    rateLimitPerMinute: number;
    hasSandbox: boolean;
    docsUrl?: string;
    status: ConnectorStatus;
    healthCheckUrl?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface ConnectorHealth {
    connectorId: string;
    status: "operational" | "degraded" | "down";
    lastCheck: Timestamp;
    responseTimeMs: number;
    message?: string;
}
export interface ConnectorOperation {
    name: string;
    description: string;
    requiredCapabilities: string[];
    idempotent: boolean;
    timeoutMs: number;
}
export declare const DRENYRA_CONNECTORS: ConnectorContract[];
export declare class ConnectorRegistry {
    private connectors;
    private health;
    constructor(connectors?: ConnectorContract[]);
    get(id: string): ConnectorContract | undefined;
    list(category?: ConnectorCategory): ConnectorContract[];
    findByCapability(capability: string): ConnectorContract[];
    getOperations(connectorId: string): ConnectorOperation[];
    recordHealth(health: ConnectorHealth): void;
    getHealth(connectorId: string): ConnectorHealth | undefined;
}
//# sourceMappingURL=connector-framework.d.ts.map