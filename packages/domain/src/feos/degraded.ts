/**
 * FEOS-017 — Degraded and UNKNOWN Operations
 *
 * Framework for handling degraded mode operations when agents, APIs,
 * or external services are unavailable. Every workspace can enter
 * a degraded or UNKNOWN state, and the system must provide clear
 * recovery paths.
 *
 * Principles:
 * - UNKNOWN never means success — it's always a gap to investigate
 * - Degraded mode is explicit and visible to the user
 * - Circuit breakers prevent cascading failures
 * - Recovery procedures are documented for every capability
 *
 * @module @drenyra/domain/feos/degraded
 */

import type { Timestamp } from "./types";
import { FeosError, generateId, nowTimestamp } from "./types";

// ============================================================================
// Service Status
// ============================================================================

export type ServiceStatus = "operational" | "degraded" | "down" | "unknown";

export interface ServiceHealth {
  serviceName: string;
  status: ServiceStatus;
  lastCheck: Timestamp;
  responseTimeMs?: number;
  errorRate?: number;
  message?: string;
}

// ============================================================================
// Circuit Breaker
// ============================================================================

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit. */
  failureThreshold: number;
  /** Time in ms before attempting half-open. */
  resetTimeoutMs: number;
  /** Number of success in half-open to close. */
  halfOpenSuccessThreshold: number;
}

export const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenSuccessThreshold: 2,
};

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

export class CircuitBreaker {
  private state: CircuitBreakerState;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.state = {
      name,
      state: "closed",
      failureCount: 0,
      successCount: 0,
      config: { ...DEFAULT_CIRCUIT_BREAKER, ...config },
    };
  }

  get name(): string { return this.state.name; }
  get currentState(): CircuitState { return this.state.state; }
  get failureCount(): number { return this.state.failureCount; }

  /**
   * Whether the circuit allows requests through.
   * Closed = yes. Open = no. Half-open = yes (test request).
   */
  allowsRequest(): boolean {
    if (this.state.state === "closed") return true;
    if (this.state.state === "open") {
      // Check if reset timeout has elapsed
      if (this.state.openedAt) {
        const elapsed = Date.now() - this.state.openedAt.unix;
        if (elapsed >= this.state.config.resetTimeoutMs) {
          this.state = { ...this.state, state: "half_open", successCount: 0 };
          return true; // Allow test request
        }
      }
      return false;
    }
    // half_open — allow but track
    return true;
  }

  /**
   * Record a successful operation.
   */
  recordSuccess(): void {
    this.state = {
      ...this.state,
      state: this.state.state === "half_open"
        ? (this.state.successCount + 1 >= this.state.config.halfOpenSuccessThreshold ? "closed" : "half_open")
        : "closed",
      failureCount: 0,
      successCount: this.state.successCount + 1,
      lastSuccessAt: nowTimestamp(),
    };
  }

  /**
   * Record a failed operation.
   */
  recordFailure(): void {
    this.state = {
      ...this.state,
      state: this.state.failureCount + 1 >= this.state.config.failureThreshold ? "open" : this.state.state,
      failureCount: this.state.failureCount + 1,
      successCount: 0,
      lastFailureAt: nowTimestamp(),
      openedAt: this.state.failureCount + 1 >= this.state.config.failureThreshold
        ? nowTimestamp()
        : this.state.openedAt,
    };
  }

  /**
   * Reset the circuit breaker to closed state.
   */
  reset(): void {
    this.state = {
      ...this.state,
      state: "closed",
      failureCount: 0,
      successCount: 0,
      openedAt: undefined,
    };
  }

  toJSON(): CircuitBreakerState {
    return { ...this.state };
  }
}

// ============================================================================
// Capability Status — tracks availability per capability
// ============================================================================

export interface CapabilityStatus {
  capability: string;
  status: ServiceStatus;
  circuitBreaker: CircuitBreakerState;
  lastChecked: Timestamp;
  degradedMessage?: string;
  recoveryProcedure?: string;
  fallbackCapability?: string;
}

// ============================================================================
// Degraded Mode Manager
// ============================================================================

export interface DegradedModeConfig {
  /** Whether degraded mode is active for this workspace/company. */
  active: boolean;
  /** Capabilities that are currently degraded. */
  degradedCapabilities: string[];
  /** Capabilities that are completely down. */
  downCapabilities: string[];
  /** Human-readable message explaining the degraded state. */
  message: string;
  /** Timestamp. */
  since: Timestamp;
  /** Recovery ETA if known. */
  recoveryEta?: Timestamp;
  /** Escalation contact. */
  escalationContact?: string;
  /** Runbook URL. */
  runbookUrl?: string;
}

// ============================================================================
// UNKNOWN State Recovery
// ============================================================================

export interface UnknownStateResolution {
  workspaceId: string;
  detectedAt: Timestamp;
  resolution: "rediscovered" | "failed" | "requires_manual_intervention";
  resolvedAt?: Timestamp;
  resolutionNotes?: string;
  evidence?: string; // Evidence hash or reference
}

/**
 * Generate recovery instructions for a workspace in UNKNOWN state.
 */
export function generateRecoveryPlan(
  workspaceId: string,
  capabilities: string[],
): string[] {
  const steps: string[] = [
    `1. Investigate workspace "${workspaceId}" — check agents, logs, and external services`,
    `2. Rediscover workspace state by re-running the last known operation`,
    `3. If rediscovery succeeds: resolve to "queued" and resume`,
    `4. If rediscovery fails: mark as "failed" and investigate root cause`,
    `5. Document the resolution in the workspace metadata`,
  ];

  if (capabilities.includes("sire")) {
    steps.push("6. Verify SIRE connection: check SUNAT API availability and credentials");
  }
  if (capabilities.includes("banking")) {
    steps.push("7. Verify banking connection: check Prometeo/banking provider status");
  }

  return steps;
}

// ============================================================================
// Degraded Mode Store Interface
// ============================================================================

export interface DegradedModeStore {
  /** Get current degraded mode config for a scope. */
  getConfig(organizationId: string, companyId?: string): Promise<DegradedModeConfig | null>;
  /** Set degraded mode config. */
  setConfig(config: DegradedModeConfig): Promise<void>;
  /** Get health status of a service. */
  getServiceHealth(serviceName: string): Promise<ServiceHealth | null>;
  /** Update service health. */
  updateServiceHealth(health: ServiceHealth): Promise<void>;
  /** List all capabilities with degraded status. */
  listDegraded(organizationId: string): Promise<CapabilityStatus[]>;
}
