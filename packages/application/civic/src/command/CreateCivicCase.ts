/**
 * CreateCivicCase — Command handler
 *
 * Creates a new civic investigation case with optional election and fraud indicator references.
 */
import type { CivicCaseRepository } from "@arkelythex/domain-civic";
import { CivicCase, CivicCaseStatus } from "@arkelythex/domain-civic";
import type { CivicCaseDTO } from "../dto/CivicCase.dto";

export interface CreateCivicCaseInput {
	name: string;
	electionIds?: string[];
	fraudIndicators?: Array<{
		type: string;
		severity: string;
		description: string;
		evidence: string[];
	}>;
}

export class CreateCivicCase {
	constructor(private readonly civicCaseRepo: CivicCaseRepository) {}

	async execute(input: CreateCivicCaseInput): Promise<CivicCaseDTO> {
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
