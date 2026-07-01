import type { EvidenceRepository } from "@arkelythex/domain/repositories/evidence.repository";

export interface EvidenceTimelineEntry {
	action: string;
	previousStatus: string;
	newStatus: string;
	actor: string;
	timestamp: string;
	metadata?: Record<string, unknown>;
}

export class GetEvidenceTimelineHandler {
	constructor(private readonly evidenceRepository: EvidenceRepository) {}

	async execute(query: {
		id: string;
		organizationId: number;
	}): Promise<EvidenceTimelineEntry[]> {
		const evidence = await this.evidenceRepository.findForOrganization(
			query.id,
			query.organizationId,
		);

		if (!evidence) {
			return [];
		}

		const entries: EvidenceTimelineEntry[] = [
			{
				action: "CREATED",
				previousStatus: "NONE",
				newStatus: evidence.status,
				actor: "system",
				timestamp: evidence.createdAt.toISOString(),
				metadata: { filename: evidence.filename, source: evidence.source },
			},
		];

		if (evidence.validatedAt) {
			entries.push({
				action: "VALIDATED",
				previousStatus: "UPLOADED",
				newStatus: "VALIDATED",
				actor: evidence.validatedBy ?? "system",
				timestamp: evidence.validatedAt.toISOString(),
			});
		}

		if (evidence.errorMessage) {
			entries.push({
				action: "ERROR",
				previousStatus: evidence.status,
				newStatus: "ERROR",
				actor: "system",
				timestamp: evidence.updatedAt.toISOString(),
				metadata: { errorMessage: evidence.errorMessage },
			});
		}

		return entries;
	}
}
