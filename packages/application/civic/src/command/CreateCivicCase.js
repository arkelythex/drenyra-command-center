import { CivicCase, CivicCaseStatus } from "@arkelythex/domain-civic";
export class CreateCivicCase {
    civicCaseRepo;
    constructor(civicCaseRepo) {
        this.civicCaseRepo = civicCaseRepo;
    }
    async execute(input) {
        const civicCase = CivicCase.create({
            name: input.name,
            status: CivicCaseStatus.DRAFT,
            electionIds: input.electionIds,
        });
        await this.civicCaseRepo.save(civicCase);
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
            createdAt: civicCase.createdAt.toISOString(),
            updatedAt: civicCase.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=CreateCivicCase.js.map