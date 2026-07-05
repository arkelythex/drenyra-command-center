import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { EvidenceDTO } from "./dtos";
import type { GetEvidenceByIdQuery } from "./queries";

export class GetEvidenceHandler {
	constructor(private readonly evidenceRepository: EvidenceRepository) {}

	async execute(query: GetEvidenceByIdQuery): Promise<EvidenceDTO | null> {
		const evidence = await this.evidenceRepository.findForOrganization(
			query.id,
			query.organizationId,
		);

		if (!evidence) {
			return null;
		}

		return {
			id: evidence.id,
			organizationId: evidence.organizationId,
			companyId: evidence.companyId,
			filename: evidence.filename,
			mimeType: evidence.mimeType,
			sizeBytes: evidence.sizeBytes,
			hash: evidence.hash,
			evidenceType: evidence.evidenceType,
			source: evidence.source,
			status: evidence.status,
			metadata: evidence.metadata,
			extractedData: evidence.extractedData,
			classifierResult: evidence.classifierResult,
			validatedAt: evidence.validatedAt?.toISOString(),
			validatedBy: evidence.validatedBy,
			errorMessage: evidence.errorMessage,
			tags: evidence.tags ? [...evidence.tags] : undefined,
			createdAt: evidence.createdAt.toISOString(),
			updatedAt: evidence.updatedAt.toISOString(),
		};
	}
}
