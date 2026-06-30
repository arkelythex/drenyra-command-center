/**
 * DetectFraudPattern — Command handler
 *
 * Runs fraud detection algorithms on electoral acts for an election:
 * - Digit fatigue: disproportionate vote distribution
 * - Anomaly detection: outlier polling station turnout
 * - Pattern manipulation: repeating digits, round numbers
 *
 * Returns a FraudAnalysisReport with detected indicators grouped by type.
 */
import type {
	ElectionRepository,
	ElectoralActRepository,
	EventEmitter,
	FraudIndicatorRepository,
} from "@arkelythex/domain-civic";
import {
	detectAnomalousResults,
	detectDigitFatigue,
	detectPatternManipulation,
	FraudDetectedEvent,
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "@arkelythex/domain-civic";
import type { FraudAnalysisReportDTO, FraudIndicatorDTO } from "../dto";

export type AnalysisType = "digit-fatigue" | "anomaly" | "pattern-manipulation";

export interface DetectFraudPatternInput {
	electionId: string;
	analysisType: AnalysisType;
}

export class DetectFraudPattern {
	constructor(
		private readonly electionRepo: ElectionRepository,
		private readonly actRepo: ElectoralActRepository,
		private readonly indicatorRepo: FraudIndicatorRepository,
		private readonly eventEmitter: EventEmitter,
	) {}

	async execute(
		input: DetectFraudPatternInput,
	): Promise<FraudAnalysisReportDTO> {
		const election = await this.electionRepo.findById(input.electionId);
		if (!election) {
			throw new Error(`Election not found: ${input.electionId}`);
		}

		const detectedIndicators: FraudIndicator[] = [];

		// Collect all acts for this election's polling stations
		const allActs: Array<{ stationId: string; tallies: Map<string, number> }> =
			[];

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
				// Build candidate-level vote aggregates
				const candidateTotals = new Map<string, number>();
				for (const act of allActs) {
					for (const [candidateId, votes] of act.tallies) {
						candidateTotals.set(
							candidateId,
							(candidateTotals.get(candidateId) ?? 0) + (votes as number),
						);
					}
				}

				if (candidateTotals.size > 0) {
					const total = Array.from(candidateTotals.values()).reduce(
						(a, b) => a + b,
						0,
					);
					const fatigueInputs = Array.from(candidateTotals.entries()).map(
						([candidateId, votes]) => ({
							candidateId,
							votes,
							expectedDistribution: votes / total,
						}),
					);

					const fatigueResult = detectDigitFatigue(fatigueInputs);
					for (const indicator of fatigueResult.indicators) {
						detectedIndicators.push(
							FraudIndicator.create({
								type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
								severity:
									indicator.deviation > 0.3
										? FraudSeverity.HIGH
										: FraudSeverity.MEDIUM,
								description: indicator.description,
								evidence: [],
								detectedAt: new Date(),
							}),
						);
					}
				}
				break;
			}

			case "anomaly": {
				// Calculate turnout per station
				const stationTurnouts = allActs.map((act) => {
					const totalVotes = Array.from(act.tallies.values()).reduce(
						(a, b) => a + (b as number),
						0,
					);
					return {
						stationId: act.stationId,
						turnout: totalVotes / 100, // Normalized estimate
					};
				});

				const anomalyResult = detectAnomalousResults(stationTurnouts);
				for (const outlier of anomalyResult.outliers) {
					detectedIndicators.push(
						FraudIndicator.create({
							type: FraudIndicatorType.TURNOUT_SPIKE,
							severity:
								Math.abs(outlier.zScore) > 3
									? FraudSeverity.CRITICAL
									: FraudSeverity.HIGH,
							description: `Station ${outlier.stationId} has abnormal turnout (z-score: ${outlier.zScore.toFixed(2)})`,
							evidence: [],
							detectedAt: new Date(),
						}),
					);
				}
				break;
			}

			case "pattern-manipulation": {
				// Aggregate votes per candidate across all acts
				const candidateVotes = new Map<string, number>();
				for (const act of allActs) {
					for (const [candidateId, votes] of act.tallies) {
						candidateVotes.set(
							candidateId,
							(candidateVotes.get(candidateId) ?? 0) + (votes as number),
						);
					}
				}

				const manipulationInputs = Array.from(candidateVotes.entries()).map(
					([candidateId, votes]) => ({
						candidateId,
						votes,
					}),
				);

				const manipulationResult =
					detectPatternManipulation(manipulationInputs);
				for (const mc of manipulationResult.manipulatedCandidates) {
					detectedIndicators.push(
						FraudIndicator.create({
							type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
							severity: FraudSeverity.MEDIUM,
							description: mc.reason,
							evidence: [],
							detectedAt: new Date(),
						}),
					);
				}
				break;
			}
		}

		// Save all detected indicators and emit events
		for (const indicator of detectedIndicators) {
			await this.indicatorRepo.save(indicator);

			const event = new FraudDetectedEvent(
				input.electionId,
				input.electionId,
				input.electionId,
				indicator,
				indicator.severity,
			);
			await this.eventEmitter.emit(event);
		}

		// Build the report
		const indicatorDTOs: FraudIndicatorDTO[] = detectedIndicators.map((i) => ({
			type: i.type,
			severity: i.severity,
			description: i.description,
			evidence: [...i.evidence],
			detectedAt: i.detectedAt.toISOString(),
		}));

		// Group by type
		const grouped = new Map<string, FraudIndicatorDTO[]>();
		for (const ind of indicatorDTOs) {
			const group = grouped.get(ind.type) ?? [];
			group.push(ind);
			grouped.set(ind.type, group);
		}

		const criticalCount = indicatorDTOs.filter(
			(i) => i.severity === "CRITICAL",
		).length;
		const highCount = indicatorDTOs.filter((i) => i.severity === "HIGH").length;
		const mediumCount = indicatorDTOs.filter(
			(i) => i.severity === "MEDIUM",
		).length;
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
