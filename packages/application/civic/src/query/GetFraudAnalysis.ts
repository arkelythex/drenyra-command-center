/**
 * GetFraudAnalysis — Query handler
 *
 * Returns fraud indicators for an election, optionally filtered by type and severity.
 * Indicators are grouped by type and severity for analysis.
 */
import type { FraudIndicatorRepository } from "@arkelythex/domain-civic";
import type { FraudAnalysisReportDTO, FraudIndicatorDTO } from "../dto";

export interface GetFraudAnalysisInput {
	electionId: string;
	type?: string;
	severity?: string;
}

export class GetFraudAnalysis {
	constructor(private readonly indicatorRepo: FraudIndicatorRepository) {}

	async execute(input: GetFraudAnalysisInput): Promise<FraudAnalysisReportDTO> {
		let indicators = await this.indicatorRepo.findByElection(input.electionId);

		// Apply filters
		if (input.type) {
			indicators = indicators.filter((i) => i.type === input.type);
		}

		if (input.severity) {
			indicators = indicators.filter((i) => i.severity === input.severity);
		}

		// Map to DTOs
		const indicatorDTOs: FraudIndicatorDTO[] = indicators.map((i) => ({
			type: i.type,
			severity: i.severity,
			description: i.description,
			evidence: [...i.evidence],
			detectedAt: i.detectedAt.toISOString(),
		}));

		// Group by type
		const groupedByType = new Map<string, FraudIndicatorDTO[]>();
		for (const ind of indicatorDTOs) {
			const group = groupedByType.get(ind.type) ?? [];
			group.push(ind);
			groupedByType.set(ind.type, group);
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
			analysisType: "all",
			indicators: indicatorDTOs,
			summary: {
				totalIndicators: indicatorDTOs.length,
				criticalCount,
				highCount,
				mediumCount,
				lowCount,
			},
			groups: Array.from(groupedByType.entries()).map(
				([type, groupIndicators]) => ({
					type,
					indicators: groupIndicators,
				}),
			),
		};
	}
}
