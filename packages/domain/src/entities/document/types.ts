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
	providerRUC?: string | undefined | undefined;
	providerName?: string | undefined | undefined;
	issueDate?: Date | undefined | undefined;
	documentNumber?: string | undefined | undefined;
	baseAmount?: number | undefined | undefined;
	igvAmount?: number | undefined | undefined;
	totalAmount?: number | undefined | undefined;
	currency?: "PEN" | "USD" | undefined;
	confidenceScore?: number | undefined | undefined;
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
	extractedData?: ExtractedData | undefined | undefined;
	confidenceLevel?: ConfidenceLevel | undefined | undefined;
	validatedBy?: string | undefined | undefined;
	validatedAt?: Date | undefined | undefined;
	validationNotes?: string | undefined | undefined;
	accountingEntryId?: string | undefined | undefined;
	uploadedAt: Date;
	processedAt?: Date | undefined | undefined;
	createdAt: Date;
	updatedAt: Date;
}
