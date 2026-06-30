import { CaseEscalatedEvent } from "@arkelythex/domain-civic";
export class EscalateCivicCase {
    civicCaseRepo;
    eventEmitter;
    constructor(civicCaseRepo, eventEmitter) {
        this.civicCaseRepo = civicCaseRepo;
        this.eventEmitter = eventEmitter;
    }
    async execute(input) {
        const civicCase = await this.civicCaseRepo.findById(input.caseId);
        if (!civicCase) {
            throw new Error(`Civic case not found: ${input.caseId}`);
        }
        const escalated = civicCase.escalate(input.reason);
        await this.civicCaseRepo.save(escalated);
        const event = new CaseEscalatedEvent(escalated.id, escalated.id, input.reason, input.escalatedTo);
        await this.eventEmitter.emit(event);
        return {
            id: escalated.id,
            name: escalated.name,
            status: escalated.status,
            electionIds: [...escalated.electionIds],
            fraudIndicators: escalated.fraudIndicators.map((fi) => ({
                type: fi.type,
                severity: fi.severity,
                description: fi.description,
                evidence: [...fi.evidence],
                detectedAt: fi.detectedAt.toISOString(),
            })),
            timeline: [...escalated.timeline],
            escalationReason: escalated.escalationReason,
            createdAt: escalated.createdAt.toISOString(),
            updatedAt: escalated.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=EscalateCivicCase.js.map