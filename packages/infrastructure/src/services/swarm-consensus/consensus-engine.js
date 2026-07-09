const ROLE_WEIGHTS = {
	lector: 0.35,
	validador: 0.4,
	detector: 0.25,
};
export const THRESHOLD_CONFIG = {
	low: { base: 0.77, critical: 0.95 },
	medium: { base: 0.82, critical: 0.95 },
	high: { base: 0.88, critical: 0.95 },
	critical: { base: 0.95, critical: 0.99 },
};
const MAX_DYNAMIC_THRESHOLD = 0.99;
export function calculateWeightedConfidence(confidences) {
	return confidences.map((c) => ({
		...c,
		confidence: c.confidence * (ROLE_WEIGHTS[c.agentRole] ?? 0.33),
	}));
}
export function computeConsensusScore(confidences) {
	if (confidences.length === 0) return 0;
	const weightedSum = confidences.reduce((sum, c) => sum + c.confidence, 0);
	const avgForVariance = weightedSum / confidences.length;
	const variance =
		confidences.reduce(
			(sum, c) => sum + (c.confidence - avgForVariance) ** 2,
			0,
		) / confidences.length;
	const stdDev = Math.sqrt(variance);
	const agreementBonus = stdDev < 0.04 ? 0.02 : 0;
	return Math.min(weightedSum + agreementBonus, 1.0);
}
export function getThresholdForSeverity(severity) {
	return THRESHOLD_CONFIG[severity].base;
}
export function computeDynamicThreshold(severity, falsePositiveRate) {
	const { base } = THRESHOLD_CONFIG[severity];
	const fpAdjustment =
		falsePositiveRate > 0.1
			? Math.min((falsePositiveRate - 0.1) * 0.8, 0.08)
			: 0;
	return Math.min(base + fpAdjustment, MAX_DYNAMIC_THRESHOLD);
}
export function generateReasoning(
	confidences,
	consensusScore,
	threshold,
	dynamicAdjustment,
) {
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

