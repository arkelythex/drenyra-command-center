/**
 * EscalateCivicCase — Command handler
 *
 * Escalates an existing civic case with a reason and escalates to a specific entity.
 * Emits a CaseEscalatedEvent through the EventEmitter.
 */
import type {
	CivicCaseRepository,
	EventEmitter,
} from "@arkelythex/domain-civic";
import { CaseEscalatedEvent } from "@arkelythex/domain-civic";
import type { CivicCaseDTO } from "../dto/CivicCase.dto";

export interface EscalateCivicCaseInput {
	caseId: string;
	reason: string;
	escalatedTo: string;
}

export class EscalateCivicCase {
	constructor(
		private readonly civicCaseRepo: CivicCaseRepository,
		private readonly eventEmitter: EventEmitter,
	) {}

	async execute(input: EscalateCivicCaseInput): Promise<CivicCaseDTO> {
		const civicCase = await this.civicCaseRepo.findById(input.caseId);
		if (!civicCase) {
			throw new Error(`Civic case not found: ${input.caseId}`);
		}

		const escalated = civicCase.escalate(input.reason);
		await this.civicCaseRepo.save(escalated);

		const event = new CaseEscalatedEvent(
			escalated.id,
			escalated.id,
			input.reason,
			input.escalatedTo,
		);
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
