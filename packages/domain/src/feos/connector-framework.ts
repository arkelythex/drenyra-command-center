/**
 * FEOS-015 — Connector Conformance Framework
 *
 * Standardized framework for external system connectors (SUNAT, banks, ERPs, etc.).
 * Each connector implements a conformance contract: discovery, auth, operations, health.
 *
 * @module @drenyra/domain/feos/connector-framework
 */

import type { Timestamp } from "./types";
import { nowTimestamp } from "./types";

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
  /** Base URL for the connector's API. */
  baseUrl: string;
  /** Connector capabilities (e.g. ["invoice:send", "balance:query"]). */
  capabilities: string[];
  /** Supported country codes. */
  supportedCountries: string[];
  /** Rate limit per minute. */
  rateLimitPerMinute: number;
  /** Whether the connector supports sandbox mode. */
  hasSandbox: boolean;
  /** Documentation URL. */
  docsUrl?: string;
  /** Status. */
  status: ConnectorStatus;
  /** Health check URL. */
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

// ============================================================================
// Connector Registry
// ============================================================================

export const DRENYRA_CONNECTORS: ConnectorContract[] = [
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
  private connectors: Map<string, ConnectorContract> = new Map();
  private health: Map<string, ConnectorHealth> = new Map();

  constructor(connectors?: ConnectorContract[]) {
    for (const c of connectors ?? DRENYRA_CONNECTORS) {
      this.connectors.set(c.id, c);
    }
  }

  get(id: string): ConnectorContract | undefined {
    return this.connectors.get(id);
  }

  list(category?: ConnectorCategory): ConnectorContract[] {
    const all = Array.from(this.connectors.values());
    return category ? all.filter((c) => c.category === category) : all;
  }

  findByCapability(capability: string): ConnectorContract[] {
    return Array.from(this.connectors.values()).filter((c) => c.capabilities.includes(capability));
  }

  getOperations(connectorId: string): ConnectorOperation[] {
    const c = this.connectors.get(connectorId);
    return c ? c.capabilities.map((cap) => ({
      name: cap, description: `${c.name}: ${cap}`,
      requiredCapabilities: [cap], idempotent: true, timeoutMs: 30000,
    })) : [];
  }

  recordHealth(health: ConnectorHealth): void {
    this.health.set(health.connectorId, health);
  }

  getHealth(connectorId: string): ConnectorHealth | undefined {
    return this.health.get(connectorId);
  }
}
