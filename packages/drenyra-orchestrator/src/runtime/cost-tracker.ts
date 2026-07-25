/**
 * SDD-009A — Cache observation and cost tracking.
 *
 * Reads token/cost metrics from OpenCode SQLite database (read-only).
 * Degrades gracefully to UNOBSERVABLE if schema changes.
 * Never writes to the OpenCode database.
 */

import type {
	CacheCostBreakdown,
	MetricSource,
	ModelPricing,
	TokenObservation,
} from "./budget";

// ============================================================================
// SQLite Adapter — read-only, schema-versioned
// ============================================================================

export interface OpenCodeSessionRow {
	id: string;
	cost: number;
	tokens_input: number;
	tokens_output: number;
	tokens_cache_read: number;
	tokens_cache_write: number;
	time_created: number;
	model: string; // JSON {id, providerID, variant}
	title: string;
}

export interface SessionAdapter {
	/** Find session ID from the most recent N sessions. */
	findRecentSessions(limit: number): Promise<OpenCodeSessionRow[]>;
	/** Get a specific session by ID. */
	getSession(sessionId: string): Promise<OpenCodeSessionRow | null>;
	/** Check if the adapter is operational. */
	health(): Promise<{
		ok: boolean;
		schemaVersion: string | null;
		error?: string;
	}>;
}

// ============================================================================
// Cost calculation — SDD-009A
// ============================================================================

export function calculateCostFromTokens(
	tokens: TokenObservation,
	pricing: ModelPricing,
): CacheCostBreakdown {
	const cacheRead =
		tokens.cacheReadTokens === "UNOBSERVABLE"
			? ("UNOBSERVABLE" as const)
			: tokens.cacheReadTokens;

	const uncached =
		tokens.uncachedInputTokens === "UNOBSERVABLE"
			? ("UNOBSERVABLE" as const)
			: tokens.uncachedInputTokens;

	const output =
		tokens.outputTokens === "UNOBSERVABLE"
			? ("UNOBSERVABLE" as const)
			: tokens.outputTokens;

	// Normal input cost
	const normalInputUsd =
		uncached === "UNOBSERVABLE"
			? ("UNOBSERVABLE" as const)
			: (uncached * pricing.inputUsdPerMToken) / 1_000_000;

	// Cached input cost
	const cachedInputUsd =
		cacheRead === "UNOBSERVABLE" ||
		pricing.cachedInputUsdPerMToken === "NOT_APPLICABLE"
			? ("NOT_APPLICABLE" as const)
			: (cacheRead * pricing.cachedInputUsdPerMToken) / 1_000_000;

	// Output cost
	const outputUsd: number | "UNOBSERVABLE" | "NOT_APPLICABLE" =
		output === "UNOBSERVABLE"
			? ("UNOBSERVABLE" as const)
			: (output * pricing.outputUsdPerMToken) / 1_000_000;

	// Total
	const costValues = [normalInputUsd, cachedInputUsd, outputUsd] as const;
	const numericValues: number[] = [];
	for (const v of costValues) {
		if (typeof v === "number") numericValues.push(v);
	}
	const totalUsd: number | "UNOBSERVABLE" =
		numericValues.length === 0
			? ("UNOBSERVABLE" as const)
			: numericValues.reduce((a, b) => a + b, 0);

	return {
		normalInputUsd,
		cachedInputUsd,
		outputUsd,
		totalUsd,
		metricSource: tokens.metricSource,
	};
}

// ============================================================================
// Token observation builder
// ============================================================================

export function buildTokenObservation(
	row: OpenCodeSessionRow,
	source: MetricSource,
): TokenObservation {
	const cacheRead = row.tokens_cache_read;
	const uncachedInput = Math.max(0, row.tokens_input - row.tokens_cache_read);
	const output = row.tokens_output;

	const cacheHitRate =
		cacheRead + uncachedInput > 0
			? cacheRead / (cacheRead + uncachedInput)
			: ("UNOBSERVABLE" as const);

	return {
		cacheReadTokens: cacheRead,
		uncachedInputTokens: uncachedInput,
		outputTokens: output,
		cacheHitRate,
		metricSource: source,
		observabilityStatus: "OBSERVED",
		notes: undefined,
	};
}
