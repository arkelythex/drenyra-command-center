/**
 * FEOS-018 — Product Telemetry and Continuous Improvement
 *
 * Telemetry for product usage, performance, and improvement feedback.
 * All telemetry is privacy-preserving and focused on product decisions.
 *
 * Principles:
 * - No PII or sensitive financial data
 * - Aggregated by default, individual only for debugging
 * - Telemetry drives roadmap decisions
 * - Measure: cost per document, per reconciliation, per close
 *
 * @module @drenyra/domain/feos/product-telemetry
 */

import type { Timestamp } from "./types";
import { generateId, nowTimestamp } from "./types";

// ============================================================================
// Telemetry Events
// ============================================================================

export type TelemetryCategory =
  | "feature_usage"
  | "performance"
  | "error"
  | "workflow"
  | "agent"
  | "cost";

export interface TelemetryEvent {
  id: string;
  category: TelemetryCategory;
  name: string;
  value?: number;
  tags: string[];
  durationMs?: number;
  metadata?: Record<string, unknown>;
  workspaceId?: string;
  sessionId?: string;
  timestamp: Timestamp;
}

// ============================================================================
// Cost Metrics
// ============================================================================

export interface CostMetric {
  metric: string;
  value: number;
  unit: string;
  period: string;    // e.g. "2026-06"
  workspaceId?: string;
  companyId?: string;
}

/** Key cost metrics to track. */
export function emptyCostMetrics(period: string): CostMetric[] {
  return [
    { metric: "cost_per_document", value: 0, unit: "USD", period },
    { metric: "cost_per_reconciliation", value: 0, unit: "USD", period },
    { metric: "cost_per_closed_company", value: 0, unit: "USD", period },
    { metric: "tokens_per_workflow", value: 0, unit: "tokens", period },
    { metric: "human_minutes_per_exception", value: 0, unit: "minutes", period },
    { metric: "infra_cost_per_tenant", value: 0, unit: "USD", period },
  ];
}

// ============================================================================
// Usage Metrics
// ============================================================================

export interface UsageMetric {
  feature: string;
  action: string;
  count: number;
  uniqueUsers: number;
  period: string;
}

// ============================================================================
// Telemetry Store
// ============================================================================

export class TelemetryStore {
  private events: TelemetryEvent[] = [];
  private metrics: Map<string, CostMetric[]> = new Map();

  record(event: Omit<TelemetryEvent, "id" | "timestamp">): TelemetryEvent {
    const e: TelemetryEvent = { ...event, id: generateId(), timestamp: nowTimestamp() };
    this.events.push(e);
    return e;
  }

  recordCost(metric: CostMetric): void {
    const key = `${metric.period}:${metric.metric}`;
    const existing = this.metrics.get(key) ?? [];
    existing.push(metric);
    this.metrics.set(key, existing);
  }

  getEvents(category?: TelemetryCategory, limit = 100): TelemetryEvent[] {
    let result = this.events;
    if (category) result = result.filter((e) => e.category === category);
    return result.slice(-limit);
  }

  getCostMetrics(period: string): CostMetric[] {
    const result: CostMetric[] = [];
    for (const [key, metrics] of this.metrics) {
      if (key.startsWith(period)) result.push(...metrics);
    }
    return result;
  }

  /** Compute aggregated cost per metric for a period. */
  aggregateCost(period: string): CostMetric[] {
    const base = emptyCostMetrics(period);
    const actual = this.getCostMetrics(period);

    for (const m of base) {
      const matching = actual.filter((a) => a.metric === m.metric);
      if (matching.length > 0) {
        m.value = matching.reduce((sum, a) => sum + a.value, 0) / matching.length;
      }
    }

    return base;
  }
}
