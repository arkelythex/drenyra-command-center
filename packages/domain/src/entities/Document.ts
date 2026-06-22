/**
 * Document Entity.
 *
 * @description Represents a raw document (Image, PDF, or XML) uploaded to the
 * Intelligent Document Processing (IDP) pipeline. This entity tracks the
 * document's lifecycle from initial upload through OCR extraction, AI
 * classification, human validation (HITL), and final accounting entry creation.
 *
 * @lifecycle
 * UPLOADED -> EXTRACTING -> PENDING_VALIDATION -> VALIDATED -> PROCESSING -> PROCESSED
 *
 * @since 1.0.0
 * Supported raw document types handled by the IDP pipeline.
 *
 * @example
 * ```ts
 * const t: DocumentType = "PDF";
 * ```
 */

export type DocumentType = "IMAGE" | "XML" | "PDF";

/**
 * Document processing status in the IDP pipeline.
 *
 * @example
 * ```ts
 * const s: DocumentStatus = "UPLOADED";
 * ```
 */
export type DocumentStatus =
	| "UPLOADED" // Just uploaded, waiting for processing
	| "EXTRACTING" // OCR/AI in progress
	| "PENDING_VALIDATION" // Waiting for human review
	| "VALIDATED" // Accountant approved
	| "PROCESSING" // Creating accounting entry
	| "PROCESSED" // Done - sent to SIRE
	| "REJECTED" // Accountant rejected
	| "ERROR"; // Error in pipeline

/**
 * Coarse confidence bucket derived from a numeric score.
 *
 * @example
 * ```ts
 * const c: ConfidenceLevel = "HIGH";
 * ```
 */
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

/**
 * Data extracted from a document (OCR/AI results).
 *
 * @example
 * ```ts
 * const data: ExtractedData = { providerRUC: "20123456789", totalAmount: 118, currency: "PEN", confidenceScore: 90 };
 * ```
 */
export interface ExtractedData {
	providerRUC?: string;
	providerName?: string;
	issueDate?: Date;
	documentNumber?: string;
	baseAmount?: number;
	igvAmount?: number;
	totalAmount?: number;
	currency?: "PEN" | "USD";
	confidenceScore?: number; // 0-100
}

/**
 * Properties used to construct a {@link Document}.
 *
 * @example
 * ```ts
 * const props: DocumentProps = {
 *   id: "doc_1",
 *   clientId: "cmp_1",
 *   clientName: "ACME",
 *   fileName: "invoice.pdf",
 *   fileUrl: "https://...",
 *   fileType: "PDF",
 *   fileSize: 123,
 *   status: "UPLOADED",
 *   uploadedAt: new Date(),
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface DocumentProps {
	id: string;
	clientId: string;
	clientName: string;

	// File info
	fileName: string;
	fileUrl: string;
	fileType: DocumentType;
	fileSize: number;

	// Processing
	status: DocumentStatus;
	extractedData?: ExtractedData;
	confidenceLevel?: ConfidenceLevel;

	// Validation
	validatedBy?: string; // User ID of accountant
	validatedAt?: Date;
	validationNotes?: string;

	// Accounting
	accountingEntryId?: string;

	// Metadata
	uploadedAt: Date;
	processedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Document aggregate for IDP pipeline tracking.
 *
 * @example
 * ```ts
 * const doc = Document.create({} as DocumentProps);
 * doc.needsReview();
 * ```
 */
export class Document {
	private constructor(private props: DocumentProps) {
		Object.freeze(this);
	}

	static create(props: DocumentProps): Document {
		return new Document(props);
	}

	/**
	 * Mark as extracting (OCR/AI in progress)
	 */
	startExtraction(): Document {
		if (this.props.status !== "UPLOADED") {
			throw new Error("Can only start extraction on UPLOADED documents");
		}

		return new Document({
			...this.props,
			status: "EXTRACTING",
			updatedAt: new Date(),
		});
	}

	/**
	 * Complete extraction with data
	 */
	completeExtraction(extractedData: ExtractedData): Document {
		if (this.props.status !== "EXTRACTING") {
			throw new Error("Can only complete extraction on EXTRACTING documents");
		}

		const confidenceLevel = this.calculateConfidenceLevel(
			extractedData.confidenceScore || 0,
		);

		return new Document({
			...this.props,
			status: "PENDING_VALIDATION",
			extractedData,
			confidenceLevel,
			updatedAt: new Date(),
		});
	}

	/**
	 * Validate document (accountant approval)
	 */
	validate(validatedBy: string, notes?: string): Document {
		if (this.props.status !== "PENDING_VALIDATION") {
			throw new Error("Can only validate PENDING_VALIDATION documents");
		}

		return new Document({
			...this.props,
			status: "VALIDATED",
			validatedBy,
			validatedAt: new Date(),
			validationNotes: notes,
			updatedAt: new Date(),
		});
	}

	/**
	 * Reject document
	 */
	reject(rejectedBy: string, reason: string): Document {
		return new Document({
			...this.props,
			status: "REJECTED",
			validatedBy: rejectedBy,
			validatedAt: new Date(),
			validationNotes: reason,
			updatedAt: new Date(),
		});
	}

	/**
	 * Mark as processing (creating accounting entry)
	 */
	startProcessing(): Document {
		if (this.props.status !== "VALIDATED") {
			throw new Error("Can only process VALIDATED documents");
		}

		return new Document({
			...this.props,
			status: "PROCESSING",
			updatedAt: new Date(),
		});
	}

	/**
	 * Complete processing
	 */
	completeProcessing(accountingEntryId: string): Document {
		if (this.props.status !== "PROCESSING") {
			throw new Error("Can only complete processing on PROCESSING documents");
		}

		return new Document({
			...this.props,
			status: "PROCESSED",
			accountingEntryId,
			processedAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Mark as error
	 */
	markAsError(errorMessage: string): Document {
		return new Document({
			...this.props,
			status: "ERROR",
			validationNotes: errorMessage,
			updatedAt: new Date(),
		});
	}

	/**
	 * Calculate confidence level based on score
	 */
	private calculateConfidenceLevel(score: number): ConfidenceLevel {
		if (score >= 95) return "HIGH";
		if (score >= 70) return "MEDIUM";
		return "LOW";
	}

	/**
	 * Check if document needs human review
	 */
	needsReview(): boolean {
		return (
			this.props.confidenceLevel === "MEDIUM" ||
			this.props.confidenceLevel === "LOW"
		);
	}

	/**
	 * Check if document can be auto-processed
	 */
	canAutoProcess(): boolean {
		return (
			this.props.confidenceLevel === "HIGH" && this.props.fileType === "XML"
		);
	}

	// Getters
	get id(): string {
		return this.props.id;
	}

	get clientId(): string {
		return this.props.clientId;
	}

	get clientName(): string {
		return this.props.clientName;
	}

	get fileName(): string {
		return this.props.fileName;
	}

	get fileUrl(): string {
		return this.props.fileUrl;
	}

	get fileType(): DocumentType {
		return this.props.fileType;
	}

	get fileSize(): number {
		return this.props.fileSize;
	}

	get status(): DocumentStatus {
		return this.props.status;
	}

	get extractedData(): ExtractedData | undefined {
		return this.props.extractedData;
	}

	get confidenceLevel(): ConfidenceLevel | undefined {
		return this.props.confidenceLevel;
	}

	get validatedBy(): string | undefined {
		return this.props.validatedBy;
	}

	get validatedAt(): Date | undefined {
		return this.props.validatedAt;
	}

	get validationNotes(): string | undefined {
		return this.props.validationNotes;
	}

	get accountingEntryId(): string | undefined {
		return this.props.accountingEntryId;
	}

	get uploadedAt(): Date {
		return this.props.uploadedAt;
	}

	get processedAt(): Date | undefined {
		return this.props.processedAt;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
