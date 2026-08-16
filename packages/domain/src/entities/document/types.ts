export type DocumentType = "IMAGE" | "XML" | "PDF";

export type DocumentStatus =
	| "UPLOADED"
	| "EXTRACTING"
	| "PENDING_VALIDATION"
	| "VALIDATED"
	| "PROCESSING"
	| "PROCESSED"
	| "REJECTED"
	| "ERROR";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ExtractedData {
	providerRUC?: string | undefined;
	providerName?: string | undefined;
	issueDate?: Date | undefined;
	documentNumber?: string | undefined;
	baseAmount?: number | undefined;
	igvAmount?: number | undefined;
	totalAmount?: number | undefined;
	currency?: "PEN" | "USD" | undefined;
	confidenceScore?: number | undefined;
}

export interface DocumentProps {
	id: string;
	clientId: string;
	clientName: string;
	fileName: string;
	fileUrl: string;
	fileType: DocumentType;
	fileSize: number;
	status: DocumentStatus;
	extractedData?: ExtractedData | undefined;
	confidenceLevel?: ConfidenceLevel | undefined;
	validatedBy?: string | undefined;
	validatedAt?: Date | undefined;
	validationNotes?: string | undefined;
	accountingEntryId?: string | undefined;
	uploadedAt: Date;
	processedAt?: Date | undefined;
	createdAt: Date;
	updatedAt: Date;
}
