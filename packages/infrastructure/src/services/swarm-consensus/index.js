import { anomalyAlertRepository } from "./anomaly-alert.repository";
import { calculateWeightedConfidence, computeConsensusScore, computeDynamicThreshold, generateReasoning, getThresholdForSeverity, THRESHOLD_CONFIG, } from "./consensus-engine";
export { THRESHOLD_CONFIG };
export const swarmConsensusService = {
    async calculateConsensus(agentConfidences, severity, organizationId, options) {
        const { enableDynamicThreshold = true, fpLookbackDays = 30 } = options ?? {};
        const weighted = calculateWeightedConfidence(agentConfidences);
        const consensusScore = computeConsensusScore(weighted);
        let threshold = getThresholdForSeverity(severity);
        let dynamicAdjustment = 0;
        if (enableDynamicThreshold) {
            const fpStats = await anomalyAlertRepository.getFalsePositiveRate(organizationId, severity, fpLookbackDays);
            threshold = computeDynamicThreshold(severity, fpStats.rate);
            dynamicAdjustment = threshold - getThresholdForSeverity(severity);
        }
        const shouldTrigger = consensusScore >= threshold;
        const reasoning = generateReasoning(weighted, consensusScore, threshold, dynamicAdjustment);
        const baseThreshold = getThresholdForSeverity(severity);
        const thresholdReason = dynamicAdjustment > 0
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
    async createAlertFromConsensus(organizationId, entityType, entityId, alertType, severity, consensusResult, detectorAgentId) {
        const lector = consensusResult.confidenceBreakdown.find((c) => c.agentRole === "lector");
        const validador = consensusResult.confidenceBreakdown.find((c) => c.agentRole === "validador");
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
    async recordFalsePositive(alertId, reason, userId) {
        return anomalyAlertRepository.markAsFalsePositive(alertId, reason, userId);
    },
    async confirmAlert(alertId, userId) {
        return anomalyAlertRepository.markAsConfirmed(alertId, userId);
    },
    async resolveAlert(alertId, userId) {
        return anomalyAlertRepository.markAsResolved(alertId, userId);
    },
    async getAlertById(alertId) {
        const results = await anomalyAlertRepository.findById(alertId);
        return results[0] ?? null;
    },
    async getAlertsByOrganization(organizationId, options) {
        return anomalyAlertRepository.findByOrganization(organizationId, options);
    },
};
//# sourceMappingURL=index.js.map