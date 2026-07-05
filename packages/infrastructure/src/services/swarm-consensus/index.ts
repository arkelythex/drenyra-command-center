import { anomalyAlertRepository } from "./anomaly-alert.repository";
import {
	calculateWeightedConfidence,
	computeConsensusScore,
	computeDynamicThreshold,
	generateReasoning,
	getThresholdForSeverity,
	THRESHOLD_CONFIG,
} from "./consensus-engine";
import type {
	AgentConfidence,
	AlertSeverity,
	ConsensusResult,
	DynamicConsensusOptions,
} from "./types";

export type { DynamicConsensusOptions, FalsePositiveStats } from "./types";
export { THRESHOLD_CONFIG };

/**
 * swarmConsensusService const.
 *
 * @example
 * ```ts
 * console.log(swarmConsensusService);
 * ```
 */
export const swarmConsensusService = {
	/**
	 * Calculate consensus from multi-agent confidence scores.
	 *
	 * When enableDynamicThreshold is true (default), the required threshold is
	 * raised based on the org's historical false positive rate. This implements
	 * an RLHF-inspired feedback loop without black-box ML:
	 *
	 *   • FP rate ≤ 10%  → base threshold (well-calibrated org)
	 *   • FP rate > 10%  → threshold rises up to +8pp (noisy org)
	 *
	 * For Task 1.2 target: <2% false positives at 95% consensus threshold.
	 */
	async calculateConsensus(
		agentConfidences: AgentConfidence[],
		severity: AlertSeverity,
		organizationId: number,
		options?: DynamicConsensusOptions,
	): Promise<ConsensusResult> {
		const { enableDynamicThreshold = true, fpLookbackDays = 30 } =
			options ?? {};

		const weighted = calculateWeightedConfidence(agentConfidences);
		const consensusScore = computeConsensusScore(weighted);

		let threshold = getThresholdForSeverity(severity);
		let dynamicAdjustment = 0;

		if (enableDynamicThreshold) {
			const fpStats = await anomalyAlertRepository.getFalsePositiveRate(
				organizationId,
				severity,
				fpLookbackDays,
			);
			threshold = computeDynamicThreshold(severity, fpStats.rate);
			dynamicAdjustment = threshold - getThresholdForSeverity(severity);
		}

		const shouldTrigger = consensusScore >= threshold;
		const reasoning = generateReasoning(
			weighted,
			consensusScore,
			threshold,
			dynamicAdjustment,
		);

		const baseThreshold = getThresholdForSeverity(severity);
		const thresholdReason =
			dynamicAdjustment > 0
				? `Umbral dinámico ${(threshold * 100).toFixed(0)}% para severidad ${severity} (base ${(baseThreshold * 100).toFixed(0)}% + ${(dynamicAdjustment * 100).toFixed(1)}% ajuste FP)`
				: `Umbral base ${(threshold * 100).toFixed(0)}% para severidad ${severity}`;

		return {
			threshold,
			dynamicAdjustment,
			consensusScore,
			shouldTriggerAlert: shouldTrigger,
			confidenceBreakdown: agentConfidences,
			reasoning,
			thresholdReason,
		};
	},

	async createAlertFromConsensus(
		organizationId: number,
		entityType: string,
		entityId: string,
		alertType: string,
		severity: AlertSeverity,
		consensusResult: ConsensusResult,
		detectorAgentId: string,
	) {
		const lector = consensusResult.confidenceBreakdown.find(
			(c) => c.agentRole === "lector",
		);
		const validador = consensusResult.confidenceBreakdown.find(
			(c) => c.agentRole === "validador",
		);

		return anomalyAlertRepository.create({
			organizationId,
			entityType,
			entityId,
			alertType,
			severity,
			detectorAgentId,
			detectorConfidence: consensusResult.consensusScore.toFixed(2),
			lectorConfidence: lector?.confidence.toFixed(2),
			lectorReasoning: lector?.reasoning,
			validadorConfidence: validador?.confidence.toFixed(2),
			validadorReasoning: validador?.reasoning,
			swarmConsensusThreshold: consensusResult.threshold.toFixed(2),
			swarmConsensusScore: consensusResult.consensusScore.toFixed(2),
			alertReasoning: consensusResult.reasoning,
		});
	},

	async recordFalsePositive(alertId: string, reason: string, userId: string) {
		return anomalyAlertRepository.markAsFalsePositive(alertId, reason, userId);
	},

	async confirmAlert(alertId: string, userId: string) {
		return anomalyAlertRepository.markAsConfirmed(alertId, userId);
	},

	async resolveAlert(alertId: string, userId: string) {
		return anomalyAlertRepository.markAsResolved(alertId, userId);
	},

	async getAlertById(alertId: string) {
		const results = await anomalyAlertRepository.findById(alertId);
		return results[0] ?? null;
	},

	async getAlertsByOrganization(
		organizationId: number,
		options?: { limit?: number; status?: string },
	) {
		return anomalyAlertRepository.findByOrganization(organizationId, options);
	},
};
