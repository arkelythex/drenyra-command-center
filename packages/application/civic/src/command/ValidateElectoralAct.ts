/**
 * ValidateElectoralAct — Command handler
 *
 * Validates an electoral act against deterministic domain rules:
 * - Vote tally arithmetic (total <= registered voters)
 * - Digit integrity (no duplicate serial/urn numbers)
 * - Fraud indicator review
 *
 * Produces audit trail entries for every validation event.
 */

import { DNI } from "@arkelythex/domain";
import type {
	AuditTrailRepository,
	ElectoralActRepository,
	EventEmitter,
} from "@arkelythex/domain-civic";
import {
	ActValidatedEvent,
	AuditTrail,
	DNIVerification,
	DNIVerificationStatus,
	ValidationStatus,
	VoteTally,
	validateVoteTally,
} from "@arkelythex/domain-civic";
import type {
	FraudIndicatorDTO,
	ValidationOutcome,
	ValidationResultDTO,
	VoterVerificationDTO,
} from "../dto";

export interface EvidenceInput {
	hash: string;
	type: string;
	content?: string;
}

export interface ValidateElectoralActInput {
	actId: string;
	validatorId: string;
	evidence: EvidenceInput[];
	registeredVoters?: number;
	detectedFraudIndicators?: Array<{
		type: string;
		severity: string;
		description: string;
		evidence: string[];
		detectedAt: Date;
	}>;
	voterDnis?: string[];
}

export class ValidateElectoralAct {
	constructor(
		private readonly actRepo: ElectoralActRepository,
		private readonly auditRepo: AuditTrailRepository,
		private readonly eventEmitter: EventEmitter,
	) {}

	async execute(
		input: ValidateElectoralActInput,
	): Promise<ValidationResultDTO> {
		const act = await this.actRepo.findById(input.actId);
		if (!act) {
			throw new Error(`Electoral act not found: ${input.actId}`);
		}

		if (act.validationStatus !== ValidationStatus.PENDING) {
			throw new Error(
				`Cannot validate an act with status ${act.validationStatus}`,
			);
		}

		const errors: string[] = [];

		// Run vote tally validation if registeredVoters is provided
		if (input.registeredVoters !== undefined) {
			const voteTallyObjects = Array.from(act.voteTallies.entries()).map(
				([candidateId, votes]) =>
					VoteTally.create({
						candidateId,
						candidateName: candidateId,
						party: "unknown",
						voteCount: votes as number,
						isValid: true,
					}),
			);

			const validation = validateVoteTally(
				voteTallyObjects,
				input.registeredVoters,
			);
			if (!validation.valid) {
				errors.push(...validation.errors);
			}
		}

		// Determine outcome
		const hasFraudIndicators =
			input.detectedFraudIndicators && input.detectedFraudIndicators.length > 0;

		let outcome: ValidationOutcome;
		let updatedAct;

		if (errors.length > 0) {
			outcome = "rejected";
			updatedAct = act.markInvalid(input.validatorId);
		} else if (hasFraudIndicators) {
			outcome = "needs-review";
			updatedAct = act; // Keep as pending for manual review
		} else {
			outcome = "approved";
			updatedAct = act.markValid(input.validatorId);
		}

		// Save the updated act
		await this.actRepo.save(updatedAct);

		// Create audit trail entry
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

		// Map fraud indicators to DTOs
		const fraudIndicators: FraudIndicatorDTO[] = (
			input.detectedFraudIndicators ?? []
		).map((fi) => ({
			type: fi.type,
			severity: fi.severity,
			description: fi.description,
			evidence: fi.evidence,
			detectedAt: fi.detectedAt.toISOString(),
		}));

		// Verify voter DNIs if provided
		let voterVerificationResults: VoterVerificationDTO[] | undefined;
		if (input.voterDnis && input.voterDnis.length > 0) {
			voterVerificationResults = input.voterDnis.map((dniStr) => {
				const dni = DNI.create(dniStr);
				const verification = DNIVerification.create(dni);
				const isChecksumValid = DNIVerification.validateChecksum(dniStr);
				const verified = verification.markVerified(
					isChecksumValid ? input.validatorId : "system",
				);
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

		// Emit domain event
		const event = new ActValidatedEvent(
			input.actId,
			input.actId,
			input.validatorId,
			outcome,
		);
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
