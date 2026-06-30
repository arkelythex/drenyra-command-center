/**
 * AddFraudEvidence — Command handler
 *
 * Adds fraud evidence to an existing civic case and emits FraudDetectedEvents.
 */
import type {
	CivicCaseRepository,
	EventEmitter,
} from "@arkelythex/domain-civic";
import {
	FraudDetectedEvent,
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "@arkelythex/domain-civic";
import type { CivicCaseDTO } from "../dto/CivicCase.dto";

export interface AddFraudEvidenceInput {
	caseId: string;
	actId: string;
	electionId: string;
	fraudIndicators: Array<{
		type: string;
		severity: string;
		description: string;
		evidence: string[];
	}>;
}

export class AddFraudEvidence {
	constructor(
		private readonly civicCaseRepo: CivicCaseRepository,
		private readonly eventEmitter: EventEmitter,
	) {}

	async execute(input: AddFraudEvidenceInput): Promise<CivicCaseDTO> {
		const civicCase = await this.civicCaseRepo.findById(input.caseId);
		if (!civicCase) {
			throw new Error(`Civic case not found: ${input.caseId}`);
		}

		let updatedCase = civicCase;
		const events: FraudDetectedEvent[] = [];

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

			events.push(
				new FraudDetectedEvent(
					input.caseId,
					input.electionId,
					input.actId,
					indicator,
					severity,
				),
			);
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

	private resolveIndicatorType(type: string): FraudIndicatorType {
		const validValues = Object.values(FraudIndicatorType);
		if (validValues.includes(type as FraudIndicatorType)) {
			return type as FraudIndicatorType;
		}
		return FraudIndicatorType.VOTE_PATTERN_ANOMALY;
	}

	private resolveSeverity(severity: string): FraudSeverity {
		const validValues = Object.values(FraudSeverity);
		if (validValues.includes(severity as FraudSeverity)) {
			return severity as FraudSeverity;
		}
		return FraudSeverity.MEDIUM;
	}
}
