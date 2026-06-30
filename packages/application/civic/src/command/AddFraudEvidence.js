import { FraudIndicator, FraudIndicatorType, FraudSeverity, FraudDetectedEvent, } from "@arkelythex/domain-civic";
export class AddFraudEvidence {
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
        let updatedCase = civicCase;
        const events = [];
        for (const fi of input.fraudIndicators) {
            const indicatorType = this.resolveIndicatorType(fi.type);
            const severity = this.resolveSeverity(fi.severity);
            const indicator = FraudIndicator.create({
                type: indicatorType,
                severity,
                description: fi.description,
                evidence: fi.evidence,
                detectedAt: new Date(),
            });
            updatedCase = updatedCase.addFraudIndicator(indicator);
            events.push(new FraudDetectedEvent(input.caseId, input.electionId, input.actId, indicator, severity));
        }
        await this.civicCaseRepo.save(updatedCase);
        await this.eventEmitter.emitMany(events);
        return {
            id: updatedCase.id,
            name: updatedCase.name,
            status: updatedCase.status,
            electionIds: [...updatedCase.electionIds],
            fraudIndicators: updatedCase.fraudIndicators.map((fi) => ({
                type: fi.type,
                severity: fi.severity,
                description: fi.description,
                evidence: [...fi.evidence],
                detectedAt: fi.detectedAt.toISOString(),
            })),
            timeline: [...updatedCase.timeline],
            createdAt: updatedCase.createdAt.toISOString(),
            updatedAt: updatedCase.updatedAt.toISOString(),
        };
    }
    resolveIndicatorType(type) {
        const validValues = Object.values(FraudIndicatorType);
        if (validValues.includes(type)) {
            return type;
        }
        return FraudIndicatorType.VOTE_PATTERN_ANOMALY;
    }
    resolveSeverity(severity) {
        const validValues = Object.values(FraudSeverity);
        if (validValues.includes(severity)) {
            return severity;
        }
        return FraudSeverity.MEDIUM;
    }
}
//# sourceMappingURL=AddFraudEvidence.js.map