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
	providerRUC?: string;
	providerName?: string;
	issueDate?: Date;
	documentNumber?: string;
	baseAmount?: number;
	igvAmount?: number;
	totalAmount?: number;
	currency?: "PEN" | "USD";
	confidenceScore?: number;
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
	extractedData?: ExtractedData;
	confidenceLevel?: ConfidenceLevel;
	validatedBy?: string;
	validatedAt?: Date;
	validationNotes?: string;
	accountingEntryId?: string;
	uploadedAt: Date;
	processedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}
