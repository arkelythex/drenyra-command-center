import { Evidence } from "@drenyra/domain";
import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { RegisterEvidenceCommand } from "./commands";
import type { EvidenceDTO } from "./dtos";

export class RegisterEvidenceHandler {
	constructor(private readonly evidenceRepository: EvidenceRepository) {}

	async execute(command: RegisterEvidenceCommand): Promise<EvidenceDTO> {
		const evidence = Evidence.create({
			id: crypto.randomUUID(),
			organizationId: command.organizationId,
			...(command.companyId !== undefined
				? { companyId: command.companyId }
				: {}),
			filename: command.filename,
			mimeType: command.mimeType,
			sizeBytes: command.sizeBytes,
			hash: command.hash,
			evidenceType: command.evidenceType,
			source: command.source,
			status: "UPLOADED",
			...(command.metadata !== undefined
				? { metadata: command.metadata }
				: {}),
			...(command.tags !== undefined ? { tags: command.tags } : {}),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const orgId = Number(command.organizationId);
		await this.evidenceRepository.saveForOrganization(evidence, orgId);

		return this.toDTO(evidence);
	}

	private toDTO(evidence: Evidence): EvidenceDTO {
		return {
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
		};
	}
}
