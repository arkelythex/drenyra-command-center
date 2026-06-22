import type { Document as DocumentEntity } from "@arkelythex/domain/entities/Document";
import type {
	DocumentRepository,
	DocumentTenantScope,
} from "@arkelythex/domain/repositories/document.repository";
import type {
	DocumentResponseDTO,
	KanbanBoardDTO,
} from "../../dtos/document/document-response.dto";

/**
 * GetKanbanBoardInput type.
 *
 * @example
 * ```ts
 * const value: GetKanbanBoardInput = {} as GetKanbanBoardInput;
 * console.log(value);
 * ```
 */
export type GetKanbanBoardInput = DocumentTenantScope & {
	clientId?: string;
};

/**
 * Get Kanban Board Use Case
 *
 * Returns documents organized by status for the validation dashboard
 * Includes REJECTED status for documents rejected by SIRE/SUNAT
 * @example
 * ```ts
 * const value = new GetKanbanBoardUseCase();
 * console.log(value);
 * ```
 */

export class GetKanbanBoardUseCase {
	constructor(private readonly documentRepository: DocumentRepository) {}

	async execute(input: GetKanbanBoardInput): Promise<KanbanBoardDTO> {
		if (!input.companyId) {
			throw new Error("Document tenant context is required");
		}

		const documents = await this.documentRepository.findAll(input);

		const mapToDTO = (doc: DocumentEntity): DocumentResponseDTO => ({
			id: doc.id,
			clientId: doc.clientId,
			clientName: doc.clientName,
			fileName: doc.fileName,
			fileUrl: doc.fileUrl,
			fileType: doc.fileType,
			fileSize: doc.fileSize,
			status: doc.status,
			confidenceLevel: doc.confidenceLevel,
			extractedData: doc.extractedData
				? {
						...doc.extractedData,
						issueDate: doc.extractedData.issueDate?.toISOString(),
					}
				: undefined,
			validatedBy: doc.validatedBy,
			validatedAt: doc.validatedAt?.toISOString(),
			validationNotes: doc.validationNotes,
			uploadedAt: doc.uploadedAt.toISOString(),
			processedAt: doc.processedAt?.toISOString(),
		});

		const porProcesar = documents
			.filter(
				(doc) => doc.status === "UPLOADED" || doc.status === "EXTRACTING",
			)
			.map(mapToDTO);
		const revisionHumana = documents
			.filter((doc) => doc.status === "PENDING_VALIDATION")
			.map(mapToDTO);
		const listoParaSIRE = documents
			.filter((doc) => doc.status === "VALIDATED")
			.map(mapToDTO);
		const rechazadoPorSIRE = documents
			.filter((doc) => doc.status === "REJECTED")
			.map(mapToDTO);

		return {
			porProcesar,
			revisionHumana,
			listoParaSIRE,
			rechazadoPorSIRE,
			counts: {
				porProcesar: porProcesar.length,
				revisionHumana: revisionHumana.length,
				listoParaSIRE: listoParaSIRE.length,
				rechazadoPorSIRE: rechazadoPorSIRE.length,
				total:
					porProcesar.length +
					revisionHumana.length +
					listoParaSIRE.length +
					rechazadoPorSIRE.length,
			},
		};
	}
}
