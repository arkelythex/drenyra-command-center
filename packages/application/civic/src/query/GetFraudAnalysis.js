export class GetFraudAnalysis {
    indicatorRepo;
    constructor(indicatorRepo) {
        this.indicatorRepo = indicatorRepo;
    }
    async execute(input) {
        let indicators = await this.indicatorRepo.findByElection(input.electionId);
        if (input.type) {
            indicators = indicators.filter((i) => i.type === input.type);
        }
        if (input.severity) {
            indicators = indicators.filter((i) => i.severity === input.severity);
        }
        const indicatorDTOs = indicators.map((i) => ({
            type: i.type,
            severity: i.severity,
            description: i.description,
            evidence: [...i.evidence],
            detectedAt: i.detectedAt.toISOString(),
        }));
        const groupedByType = new Map();
        for (const ind of indicatorDTOs) {
            const group = groupedByType.get(ind.type) ?? [];
            group.push(ind);
            groupedByType.set(ind.type, group);
        }
        const criticalCount = indicatorDTOs.filter((i) => i.severity === "CRITICAL").length;
        const highCount = indicatorDTOs.filter((i) => i.severity === "HIGH").length;
        const mediumCount = indicatorDTOs.filter((i) => i.severity === "MEDIUM").length;
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
            groups: Array.from(groupedByType.entries()).map(([type, groupIndicators]) => ({
                type,
                indicators: groupIndicators,
            })),
        };
    }
}
//# sourceMappingURL=GetFraudAnalysis.js.map