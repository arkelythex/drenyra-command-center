export class GetCivicCase {
    civicCaseRepo;
    constructor(civicCaseRepo) {
        this.civicCaseRepo = civicCaseRepo;
    }
    async execute(input) {
        const civicCase = await this.civicCaseRepo.findById(input.caseId);
        if (!civicCase) {
            throw new Error(`Civic case not found: ${input.caseId}`);
        }
        return {
            id: civicCase.id,
            name: civicCase.name,
            status: civicCase.status,
            electionIds: [...civicCase.electionIds],
            fraudIndicators: civicCase.fraudIndicators.map((fi) => ({
                type: fi.type,
                severity: fi.severity,
                description: fi.description,
                evidence: [...fi.evidence],
                detectedAt: fi.detectedAt.toISOString(),
            })),
            timeline: [...civicCase.timeline],
            escalationReason: civicCase.escalationReason,
            createdAt: civicCase.createdAt.toISOString(),
            updatedAt: civicCase.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=GetCivicCase.js.map