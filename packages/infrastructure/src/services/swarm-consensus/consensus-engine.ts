import type { AgentConfidence, AlertSeverity } from "./types";

const ROLE_WEIGHTS: Record<string, number> = {
	lector: 0.35,
	validador: 0.4,
	detector: 0.25,
};

/**
 * THRESHOLD_CONFIG const.
 *
 * @example
 * ```ts
 * console.log(THRESHOLD_CONFIG);
 * ```
 */
export const THRESHOLD_CONFIG = {
	low: { base: 0.77, critical: 0.95 },
	medium: { base: 0.82, critical: 0.95 },
	high: { base: 0.88, critical: 0.95 },
	critical: { base: 0.95, critical: 0.99 }, // Task 1.2: bumped 0.90 → 0.95
} as const;

/** Maximum ceiling for dynamically adjusted thresholds */
const MAX_DYNAMIC_THRESHOLD = 0.99;

/**
 * calculateWeightedConfidence operation.
 *
 * @param confidences - Input for confidences.
 * @returns Result of calculateWeightedConfidence.
 * @example
 * ```ts
 * const result = calculateWeightedConfidence([]);
 * console.log(result);
 * ```
 */
export function calculateWeightedConfidence(
	confidences: AgentConfidence[],
): AgentConfidence[] {
	return confidences.map((c) => ({
		...c,
		confidence: c.confidence * (ROLE_WEIGHTS[c.agentRole] ?? 0.33),
	}));
}

/**
 * Compute consensus score from weight-multiplied confidences.
 *
 * BUG FIX: Previous implementation divided by confidences.length (agent count),
 * treating weighted values as if they were raw values. Since ROLE_WEIGHTS sum
 * to 1.0 when all 3 agents are present, the correct score is the SUM of
 * (confidence × weight) — not the mean of weighted values.
 *
 * Example: 3 agents each at 0.90 raw confidence:
 *   lector:    0.90 × 0.35 = 0.315
 *   validador: 0.90 × 0.40 = 0.360
 *   detector:  0.90 × 0.25 = 0.225
 *   ──────────────────────────────
 *   sum   = 0.900  ← correct weighted average (was: 0.900/3 = 0.300 BUG)
 *
 * Agreement bonus: +0.02 if agents strongly agree (stdDev < 0.04 in
 * weight-normalized space), capped at 1.0.
 * @param confidences - Input for confidences.
 * @returns Result of computeConsensusScore.
 * @example
 * ```ts
 * const result = computeConsensusScore([]);
 * console.log(result);
 * ```
 */

export function computeConsensusScore(confidences: AgentConfidence[]): number {
	if (confidences.length === 0) return 0;

	// SUM of weight-multiplied confidences = weighted average (weights sum to 1)
	const weightedSum = confidences.reduce((sum, c) => sum + c.confidence, 0);

	// Variance computed on weight-normalized values to measure agreement
	const avgForVariance = weightedSum / confidences.length;
	const variance =
		confidences.reduce(
			(sum, c) => sum + (c.confidence - avgForVariance) ** 2,
			0,
		) / confidences.length;
	const stdDev = Math.sqrt(variance);

	// Smaller bonus now that the base is correctly scaled
	const agreementBonus = stdDev < 0.04 ? 0.02 : 0;
	return Math.min(weightedSum + agreementBonus, 1.0);
}

/**
 * getThresholdForSeverity operation.
 *
 * @param severity - Input for severity.
 * @returns Result of getThresholdForSeverity.
 * @example
 * ```ts
 * const result = getThresholdForSeverity(undefined);
 * console.log(result);
 * ```
 */
export function getThresholdForSeverity(
	severity: keyof typeof THRESHOLD_CONFIG,
): number {
	return THRESHOLD_CONFIG[severity].base;
}

/**
 * Dynamic threshold adjustment based on historical false positive rate.
 *
 * RLHF-inspired calibration: as humans mark alerts as false positives, the
 * threshold rises automatically, reducing noise without retraining a model.
 * This is fully explainable and SUNAT-auditable (pure arithmetic, no black box).
 *
 * Formula (when fpRate > 10%):
 *   adjustment = min((fpRate − 0.10) × 0.8, 0.08)
 *   threshold  = min(base + adjustment, 0.99)
 *
 * Example — critical severity (base=0.95), org with 20% FP rate:
 *   adjustment = min((0.20 − 0.10) × 0.8, 0.08) = 0.08
 *   threshold  = min(0.95 + 0.08, 0.99) = 0.99
 * @param severity - Input for severity.
 * @param falsePositiveRate - Input for falsePositiveRate.
 * @returns Result of computeDynamicThreshold.
 * @example
 * ```ts
 * const result = computeDynamicThreshold({} as AlertSeverity, 0);
 * console.log(result);
 * ```
 */

export function computeDynamicThreshold(
	severity: AlertSeverity,
	falsePositiveRate: number,
): number {
	const { base } = THRESHOLD_CONFIG[severity];
	const fpAdjustment =
		falsePositiveRate > 0.1
			? Math.min((falsePositiveRate - 0.1) * 0.8, 0.08)
			: 0;
	return Math.min(base + fpAdjustment, MAX_DYNAMIC_THRESHOLD);
}

/**
 * generateReasoning operation.
 *
 * @param confidences - Input for confidences.
 * @param consensusScore - Input for consensusScore.
 * @param threshold - Input for threshold.
 * @param dynamicAdjustment - Input for dynamicAdjustment.
 * @returns Result of generateReasoning.
 * @example
 * ```ts
 * const result = generateReasoning([], 0, 0, 0);
 * console.log(result);
 * ```
 */
export function generateReasoning(
	confidences: AgentConfidence[],
	consensusScore: number,
	threshold: number,
	dynamicAdjustment?: number,
): string {
	const parts = confidences.map(
		(c) => `${c.agentRole}: ${(c.confidence * 100).toFixed(0)}%`,
	);
	const status =
		consensusScore >= threshold ? "✓ Confirmado" : "✗ Insuficiente";
	const adjustmentNote =
		dynamicAdjustment !== undefined && dynamicAdjustment > 0
			? ` +${(dynamicAdjustment * 100).toFixed(1)}% ajuste FP`
			: "";
	return `${parts.join(" | ")} | Score: ${(consensusScore * 100).toFixed(1)}% (umbral ${(threshold * 100).toFixed(0)}%${adjustmentNote}) | ${status}`;
}
