import { ValidationStatus, AuditTrail, VoteTally, validateVoteTally, DNIVerification, DNIVerificationStatus, ActValidatedEvent, } from "@arkelythex/domain-civic";
import { DNI } from "@arkelythex/domain";
export class ValidateElectoralAct {
    actRepo;
    auditRepo;
    eventEmitter;
    constructor(actRepo, auditRepo, eventEmitter) {
        this.actRepo = actRepo;
        this.auditRepo = auditRepo;
        this.eventEmitter = eventEmitter;
    }
    async execute(input) {
        const act = await this.actRepo.findById(input.actId);
        if (!act) {
            throw new Error(`Electoral act not found: ${input.actId}`);
        }
        if (act.validationStatus !== ValidationStatus.PENDING) {
            throw new Error(`Cannot validate an act with status ${act.validationStatus}`);
        }
        const errors = [];
        if (input.registeredVoters !== undefined) {
            const voteTallyObjects = Array.from(act.voteTallies.entries()).map(([candidateId, votes]) => VoteTally.create({
                candidateId,
                candidateName: candidateId,
                party: "unknown",
                voteCount: votes,
                isValid: true,
            }));
            const validation = validateVoteTally(voteTallyObjects, input.registeredVoters);
            if (!validation.valid) {
                errors.push(...validation.errors);
            }
        }
        const hasFraudIndicators = input.detectedFraudIndicators &&
            input.detectedFraudIndicators.length > 0;
        let outcome;
        let updatedAct;
        if (errors.length > 0) {
            outcome = "rejected";
            updatedAct = act.markInvalid(input.validatorId);
        }
        else if (hasFraudIndicators) {
            outcome = "needs-review";
            updatedAct = act;
        }
        else {
            outcome = "approved";
            updatedAct = act.markValid(input.validatorId);
        }
        await this.actRepo.save(updatedAct);
        const auditEntry = AuditTrail.create({
            actId: input.actId,
            action: "VALIDATE_ACT",
            actor: input.validatorId,
            timestamp: new Date(),
            evidence: input.evidence.map((e) => e.hash),
            metadata: {
                outcome,
                errors,
                previousStatus: ValidationStatus.PENDING,
                newStatus: updatedAct.validationStatus,
            },
        });
        await this.auditRepo.save(auditEntry);
        const fraudIndicators = (input.detectedFraudIndicators ?? []).map((fi) => ({
            type: fi.type,
            severity: fi.severity,
            description: fi.description,
            evidence: fi.evidence,
            detectedAt: fi.detectedAt.toISOString(),
        }));
        let voterVerificationResults;
        if (input.voterDnis && input.voterDnis.length > 0) {
            voterVerificationResults = input.voterDnis.map((dniStr) => {
                const dni = DNI.create(dniStr);
                const verification = DNIVerification.create(dni);
                const isChecksumValid = DNIVerification.validateChecksum(dniStr);
                const verified = verification.markVerified(isChecksumValid ? input.validatorId : "system");
                return {
                    dni: verified.dni.toString(),
                    status: isChecksumValid
                        ? DNIVerificationStatus.VERIFIED
                        : DNIVerificationStatus.UNVERIFIED,
                    verifiedAt: verified.verifiedAt?.toISOString(),
                    verifierId: verified.verifierId,
                };
            });
        }
        const event = new ActValidatedEvent(input.actId, input.actId, input.validatorId, outcome);
        await this.eventEmitter.emit(event);
        return {
            actId: input.actId,
            outcome,
            validatedAt: new Date().toISOString(),
            validatedBy: input.validatorId,
            errors,
            fraudIndicators,
            voterVerificationResults,
        };
    }
}
//# sourceMappingURL=ValidateElectoralAct.js.map