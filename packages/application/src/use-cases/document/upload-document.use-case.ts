import { Document } from "@arkelythex/domain/entities/Document";
import type { DocumentRepository } from "@arkelythex/domain/repositories/document.repository";
import type {
	UploadDocumentDTO,
	UploadDocumentResponseDTO,
} from "../../dtos/document/upload-document.dto";
import type { IStorageService } from "../../ports/storage.port";
import { saveDocumentWithTenant } from "./support/document-tenant";
import { UploadDocumentSchema } from "../../validators/document/document.validators";

/**
 * UploadDocumentUseCase class.
 *
 * @example
 * ```ts
 * const value = new UploadDocumentUseCase();
 * console.log(value);
 * ```
 */
export class UploadDocumentUseCase {
	constructor(
		private readonly documentRepository: DocumentRepository,
		private readonly storageService: IStorageService,
	) {}

	async execute(input: UploadDocumentDTO): Promise<UploadDocumentResponseDTO> {
		const validatedInput = UploadDocumentSchema.parse(input);

		const fileUrl = await this.storageService.upload(validatedInput.file, {
			folder: `documents/${validatedInput.clientId}`,
			fileName: validatedInput.fileName,
		});

		const document = Document.create({
			id: crypto.randomUUID(),
			clientId: validatedInput.clientId,
			clientName: validatedInput.clientName,
			fileName: validatedInput.fileName,
			fileUrl,
			fileType: validatedInput.fileType,
			fileSize:
				validatedInput.file instanceof File
					? validatedInput.file.size
					: validatedInput.file.length,
			status: "UPLOADED",
			uploadedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await saveDocumentWithTenant(this.documentRepository, document, validatedInput);

		return {
			documentId: document.id,
			fileUrl: document.fileUrl,
			status: document.status,
		};
	}
}
