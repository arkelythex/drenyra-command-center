import {
	Document,
	type DocumentProps,
} from "@drenyra/domain/entities/Document";
import type { DocumentRepository } from "@drenyra/domain/repositories/document.repository";
import { NotFoundError } from "@drenyra/shared/errors";
import type { ValidateDocumentDTO } from "../../dtos/document/validate-document.dto";
import { ValidateDocumentSchema } from "../../validators/document/document.validators";
import {
	findDocumentByTenant,
	updateDocumentWithTenant,
} from "./support/document-tenant";

/**
 * ValidateDocumentUseCase class.
 *
 * @example
 * ```ts
 * const value = new ValidateDocumentUseCase();
 * console.log(value);
 * ```
 */
export class ValidateDocumentUseCase {
	constructor(private readonly documentRepository: DocumentRepository) {}

	async execute(input: ValidateDocumentDTO): Promise<void> {
		const validatedInput = ValidateDocumentSchema.parse(input);

		const document = await findDocumentByTenant(
			this.documentRepository,
			validatedInput.documentId,
			validatedInput,
		);

		if (!document) {
			throw new NotFoundError("Document", validatedInput.documentId);
		}

		let finalDocument = document;
		if (validatedInput.correctedData) {
			// Reconstruct props properly to preserve status and all fields
			const updatedProps: DocumentProps = {
				id: document.id,
				clientId: document.clientId,
				clientName: document.clientName,
				fileName: document.fileName,
				fileUrl: document.fileUrl,
				fileType: document.fileType,
				fileSize: document.fileSize,
				status: document.status, // Preserve original status!
				extractedData: {
					...document.extractedData,
					...validatedInput.correctedData,
				},
				confidenceLevel: document.confidenceLevel,
				validatedBy: document.validatedBy,
				validatedAt: document.validatedAt,
				uploadedAt: document.uploadedAt,
				processedAt: document.processedAt,
				createdAt: document.createdAt,
				updatedAt: new Date(),
			};
			finalDocument = Document.create(updatedProps);
		}

		const validatedDocument = finalDocument.validate(
			validatedInput.validatedBy,
			validatedInput.notes,
		);

		await updateDocumentWithTenant(
			this.documentRepository,
			validatedDocument,
			validatedInput,
		);
	}
}
