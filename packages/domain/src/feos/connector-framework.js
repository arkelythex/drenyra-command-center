import { nowTimestamp } from "./types";
export const DRENYRA_CONNECTORS = [
    {
        id: "sunat-sire", name: "SUNAT SIRE", provider: "SUNAT",
        category: "tax_authority", version: "2.0.0", authType: "certificate",
        baseUrl: "https://api.sunat.gob.pe/v1/sire",
        capabilities: ["sire:submit", "sire:query", "sire:cancel", "cdr:download"],
        supportedCountries: ["PE"], rateLimitPerMinute: 30, hasSandbox: true,
        docsUrl: "https://www.sunat.gob.pe/legislacion/sire/", status: "active",
        healthCheckUrl: "https://api.sunat.gob.pe/health",
        createdAt: nowTimestamp(), updatedAt: nowTimestamp(),
    },
    {
        id: "prometeo-banking", name: "Prometeo Banking API", provider: "Prometeo",
        category: "bank", version: "1.0.0", authType: "api_key",
        baseUrl: "https://api.prometeo.io/v1",
        capabilities: ["account:list", "transaction:list", "balance:query", "statement:download"],
        supportedCountries: ["PE", "CO", "CL", "MX"], rateLimitPerMinute: 60, hasSandbox: true,
        status: "active",
        createdAt: nowTimestamp(), updatedAt: nowTimestamp(),
    },
    {
        id: "sunat-ose", name: "SUNAT OSE", provider: "SUNAT/OSE",
        category: "tax_authority", version: "2.1.0", authType: "certificate",
        baseUrl: "https://ose.sunat.gob.pe/v1",
        capabilities: ["invoice:send", "invoice:query", "cdr:download", "void:send"],
        supportedCountries: ["PE"], rateLimitPerMinute: 60, hasSandbox: true,
        status: "active",
        createdAt: nowTimestamp(), updatedAt: nowTimestamp(),
    },
];
export class ConnectorRegistry {
    connectors = new Map();
    health = new Map();
    constructor(connectors) {
        for (const c of connectors ?? DRENYRA_CONNECTORS) {
            this.connectors.set(c.id, c);
        }
    }
    get(id) {
        return this.connectors.get(id);
    }
    list(category) {
        const all = Array.from(this.connectors.values());
        return category ? all.filter((c) => c.category === category) : all;
    }
    findByCapability(capability) {
        return Array.from(this.connectors.values()).filter((c) => c.capabilities.includes(capability));
    }
    getOperations(connectorId) {
        const c = this.connectors.get(connectorId);
        return c ? c.capabilities.map((cap) => ({
            name: cap, description: `${c.name}: ${cap}`,
            requiredCapabilities: [cap], idempotent: true, timeoutMs: 30000,
        })) : [];
    }
    recordHealth(health) {
        this.health.set(health.connectorId, health);
    }
    getHealth(connectorId) {
        return this.health.get(connectorId);
    }
}
//# sourceMappingURL=connector-framework.js.map