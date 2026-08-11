import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { EvidenceDTO } from "./dtos";
import type { ListPendingClassificationQuery } from "./queries";

export class ListPendingClassificationHandler {
	constructor(private readonly evidenceRepository: EvidenceRepository) {}

	async execute(query: ListPendingClassificationQuery): Promise<EvidenceDTO[]> {
		const items = await this.evidenceRepository.findPendingClassification(
			query.limit,
		);

		return items
			.filter((e) => e.organizationId === String(query.organizationId))
			.map((evidence) => ({
				id: evidence.id,
				organizationId: evidence.organizationId,
				...(evidence.companyId !== undefined
					? { companyId: evidence.companyId }
					: {}),
				filename: evidence.filename,
				mimeType: evidence.mimeType,
				sizeBytes: evidence.sizeBytes,
				hash: evidence.hash,
				evidenceType: evidence.evidenceType,
				source: evidence.source,
				status: evidence.status,
				...(evidence.metadata !== undefined
					? { metadata: evidence.metadata }
					: {}),
				...(evidence.extractedData !== undefined
					? { extractedData: evidence.extractedData }
					: {}),
				...(evidence.classifierResult !== undefined
					? { classifierResult: evidence.classifierResult }
					: {}),
				...(evidence.validatedAt !== undefined
					? { validatedAt: evidence.validatedAt.toISOString() }
					: {}),
				...(evidence.validatedBy !== undefined
					? { validatedBy: evidence.validatedBy }
					: {}),
				...(evidence.errorMessage !== undefined
					? { errorMessage: evidence.errorMessage }
					: {}),
				...(evidence.tags !== undefined ? { tags: [...evidence.tags] } : {}),
				createdAt: evidence.createdAt.toISOString(),
				updatedAt: evidence.updatedAt.toISOString(),
			}));
	}
}
