/**
 * GetCivicCase — Query handler
 *
 * Retrieves a civic investigation case by ID.
 */
import type { CivicCaseRepository } from "@arkelythex/domain-civic";
import type { CivicCaseDTO } from "../dto/CivicCase.dto";

export interface GetCivicCaseInput {
	caseId: string;
}

export class GetCivicCase {
	constructor(private readonly civicCaseRepo: CivicCaseRepository) {}

	async execute(input: GetCivicCaseInput): Promise<CivicCaseDTO> {
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
