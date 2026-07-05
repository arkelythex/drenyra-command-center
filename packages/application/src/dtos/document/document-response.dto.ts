import type { DocumentStatus } from "@drenyra/domain/entities/Document";

/**
 * DocumentResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: DocumentResponseDTO = {} as DocumentResponseDTO;
 * console.log(value);
 * ```
 */
export interface DocumentResponseDTO {
	id: string;
	clientId: string;
	clientName: string;

	fileName: string;
	fileUrl: string;
	fileType: "IMAGE" | "XML" | "PDF";
	fileSize: number;

	status: DocumentStatus;
	confidenceLevel?: "HIGH" | "MEDIUM" | "LOW";

	extractedData?: {
		providerRUC?: string;
		providerName?: string;
		issueDate?: string;
		documentNumber?: string;
		baseAmount?: number;
		igvAmount?: number;
		totalAmount?: number;
		currency?: "PEN" | "USD";
		confidenceScore?: number;
	};

	validatedBy?: string;
	validatedAt?: string;
	validationNotes?: string;

	// SIRE/SUNAT rejection data
	rejectionReason?: string;
	rejectedBy?: string;
	rejectedAt?: string;

	uploadedAt: string;
	processedAt?: string;
}

/**
 * KanbanBoardDTO interface.
 *
 * @example
 * ```ts
 * const value: KanbanBoardDTO = {} as KanbanBoardDTO;
 * console.log(value);
 * ```
 */
export interface KanbanBoardDTO {
	porProcesar: DocumentResponseDTO[];
	revisionHumana: DocumentResponseDTO[];
	listoParaSIRE: DocumentResponseDTO[];
	rechazadoPorSIRE: DocumentResponseDTO[]; // Documents rejected by SIRE/SUNAT

	counts: {
		porProcesar: number;
		revisionHumana: number;
		listoParaSIRE: number;
		rechazadoPorSIRE: number;
		total: number;
	};
}
