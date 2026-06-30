import { FraudIndicator, FraudIndicatorType, FraudSeverity, detectDigitFatigue, detectAnomalousResults, detectPatternManipulation, FraudDetectedEvent, } from "@arkelythex/domain-civic";
export class DetectFraudPattern {
    electionRepo;
    actRepo;
    indicatorRepo;
    eventEmitter;
    constructor(electionRepo, actRepo, indicatorRepo, eventEmitter) {
        this.electionRepo = electionRepo;
        this.actRepo = actRepo;
        this.indicatorRepo = indicatorRepo;
        this.eventEmitter = eventEmitter;
    }
    async execute(input) {
        const election = await this.electionRepo.findById(input.electionId);
        if (!election) {
            throw new Error(`Election not found: ${input.electionId}`);
        }
        const detectedIndicators = [];
        const allActs = [];
        for (const stationId of election.pollingStationIds) {
            const stationActs = await this.actRepo.findByStation(stationId);
            for (const act of stationActs) {
                allActs.push({
                    stationId: act.stationId,
                    tallies: act.voteTallies,
                });
            }
        }
        switch (input.analysisType) {
            case "digit-fatigue": {
                const candidateTotals = new Map();
                for (const act of allActs) {
                    for (const [candidateId, votes] of act.tallies) {
                        candidateTotals.set(candidateId, (candidateTotals.get(candidateId) ?? 0) + votes);
                    }
                }
                if (candidateTotals.size > 0) {
                    const total = Array.from(candidateTotals.values()).reduce((a, b) => a + b, 0);
                    const fatigueInputs = Array.from(candidateTotals.entries()).map(([candidateId, votes]) => ({
                        candidateId,
                        votes,
                        expectedDistribution: votes / total,
                    }));
                    const fatigueResult = detectDigitFatigue(fatigueInputs);
                    for (const indicator of fatigueResult.indicators) {
                        detectedIndicators.push(FraudIndicator.create({
                            type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
                            severity: indicator.deviation > 0.3
                                ? FraudSeverity.HIGH
                                : FraudSeverity.MEDIUM,
                            description: indicator.description,
                            evidence: [],
                            detectedAt: new Date(),
                        }));
                    }
                }
                break;
            }
            case "anomaly": {
                const stationTurnouts = allActs.map((act) => {
                    const totalVotes = Array.from(act.tallies.values()).reduce((a, b) => a + b, 0);
                    return {
                        stationId: act.stationId,
                        turnout: totalVotes / 100,
                    };
                });
                const anomalyResult = detectAnomalousResults(stationTurnouts);
                for (const outlier of anomalyResult.outliers) {
                    detectedIndicators.push(FraudIndicator.create({
                        type: FraudIndicatorType.TURNOUT_SPIKE,
                        severity: Math.abs(outlier.zScore) > 3
                            ? FraudSeverity.CRITICAL
                            : FraudSeverity.HIGH,
                        description: `Station ${outlier.stationId} has abnormal turnout (z-score: ${outlier.zScore.toFixed(2)})`,
                        evidence: [],
                        detectedAt: new Date(),
                    }));
                }
                break;
            }
            case "pattern-manipulation": {
                const candidateVotes = new Map();
                for (const act of allActs) {
                    for (const [candidateId, votes] of act.tallies) {
                        candidateVotes.set(candidateId, (candidateVotes.get(candidateId) ?? 0) + votes);
                    }
                }
                const manipulationInputs = Array.from(candidateVotes.entries()).map(([candidateId, votes]) => ({
                    candidateId,
                    votes,
                }));
                const manipulationResult = detectPatternManipulation(manipulationInputs);
                for (const mc of manipulationResult.manipulatedCandidates) {
                    detectedIndicators.push(FraudIndicator.create({
                        type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
                        severity: FraudSeverity.MEDIUM,
                        description: mc.reason,
                        evidence: [],
                        detectedAt: new Date(),
                    }));
                }
                break;
            }
        }
        for (const indicator of detectedIndicators) {
            await this.indicatorRepo.save(indicator);
            const event = new FraudDetectedEvent(input.electionId, input.electionId, input.electionId, indicator, indicator.severity);
            await this.eventEmitter.emit(event);
        }
        const indicatorDTOs = detectedIndicators.map((i) => ({
            type: i.type,
            severity: i.severity,
            description: i.description,
            evidence: [...i.evidence],
            detectedAt: i.detectedAt.toISOString(),
        }));
        const grouped = new Map();
        for (const ind of indicatorDTOs) {
            const group = grouped.get(ind.type) ?? [];
            group.push(ind);
            grouped.set(ind.type, group);
        }
        const criticalCount = indicatorDTOs.filter((i) => i.severity === "CRITICAL").length;
        const highCount = indicatorDTOs.filter((i) => i.severity === "HIGH").length;
        const mediumCount = indicatorDTOs.filter((i) => i.severity === "MEDIUM").length;
        const lowCount = indicatorDTOs.filter((i) => i.severity === "LOW").length;
        return {
            electionId: input.electionId,
            analyzedAt: new Date().toISOString(),
            analysisType: input.analysisType,
            indicators: indicatorDTOs,
            summary: {
                totalIndicators: indicatorDTOs.length,
                criticalCount,
                highCount,
                mediumCount,
                lowCount,
            },
            groups: Array.from(grouped.entries()).map(([type, indicators]) => ({
                type,
                indicators,
            })),
        };
    }
}
//# sourceMappingURL=DetectFraudPattern.js.map