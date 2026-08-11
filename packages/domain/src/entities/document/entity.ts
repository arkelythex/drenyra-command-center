import type {
	ConfidenceLevel,
	DocumentProps,
	DocumentStatus,
	DocumentType,
	ExtractedData,
} from "./types";

export class Document {
	private constructor(private props: DocumentProps) {
		Object.freeze(this);
	}

	static create(props: DocumentProps): Document {
		return new Document(props);
	}

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

	validate(validatedBy: string, notes?: string): Document {
		if (this.props.status !== "PENDING_VALIDATION") {
			throw new Error("Can only validate PENDING_VALIDATION documents");
		}

		return new Document({
			...this.props,
			status: "VALIDATED",
			validatedBy,
			validatedAt: new Date(),
			...(notes !== undefined ? { validationNotes: notes } : {}),
			updatedAt: new Date(),
		});
	}

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

	markAsError(errorMessage: string): Document {
		return new Document({
			...this.props,
			status: "ERROR",
			validationNotes: errorMessage,
			updatedAt: new Date(),
		});
	}

	private calculateConfidenceLevel(score: number): ConfidenceLevel {
		if (score >= 95) return "HIGH";
		if (score >= 70) return "MEDIUM";
		return "LOW";
	}

	needsReview(): boolean {
		return (
			this.props.confidenceLevel === "MEDIUM" ||
			this.props.confidenceLevel === "LOW"
		);
	}

	canAutoProcess(): boolean {
		return (
			this.props.confidenceLevel === "HIGH" && this.props.fileType === "XML"
		);
	}

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
