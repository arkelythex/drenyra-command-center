/**
 * Shared types for fiscal anomaly detection strategies and engine.
 *
 * Anomalies are the output of all detection strategies — they describe
 * a deviation from expected fiscal behavior with severity and confidence.
 * The engine orchestrates multiple strategies and publishes results
 * to the AgentEventBus for downstream consumption.
 */

import type { AgentContext } from "../types/agent-context";

// ─── Core Anomaly type ─────────────────────────────────────────────

export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export interface Anomaly {
	id: string;
	timestamp: string;
	entityType: string;
	entityId: string;
	metric: string;
	expectedValue: number;
	actualValue: number;
	deviation: number;
	severity: AnomalySeverity;
	confidence: number;
	reasoning: string;
	detectionMethod: string;
	context: Record<string, unknown>;
}

// ─── Strategy interface ────────────────────────────────────────────

export interface AnomalyStrategy {
	/** Unique identifier for this strategy */
	id: string;

	/** Human-readable name */
	name: string;

	/** Description of what this strategy detects */
	description: string;

	/** Minimum severity threshold (optional — defaults to "low") */
	minSeverity?: AnomalySeverity;

	/**
	 * Execute detection against the given data.
	 * Returns anomalies (empty array = no issues).
	 * Can be async.
	 */
	execute(data: unknown, context: AgentContext): Anomaly[] | Promise<Anomaly[]>;
}

// ─── Engine types ──────────────────────────────────────────────────

export interface StrategyRunResult {
	strategyId: string;
	strategyName: string;
	anomalies: Anomaly[];
	durationMs: number;
	error?: string;
}

export interface FiscalAnomalyEngineOptions {
	/** Publish anomalies to event bus when severity >= this threshold */
	publishThreshold?: AnomalySeverity;

	/** Default: true */
	publishToEventBus?: boolean;

	/** Enable performance tracking (timing per strategy) */
	trackPerformance?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<AnomalySeverity, number> = {
	low: 0,
	medium: 1,
	high: 2,
	critical: 3,
};

/**
 * Compare two severities. Returns >0 if a is more severe, <0 if less, 0 if equal.
 */
export function compareSeverity(
	a: AnomalySeverity,
	b: AnomalySeverity,
): number {
	return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}

/**
 * Check if an anomaly meets a minimum severity threshold.
 */
export function meetsThreshold(
	anomaly: Anomaly,
	threshold: AnomalySeverity = "low",
): boolean {
	return compareSeverity(anomaly.severity, threshold) >= 0;
}
