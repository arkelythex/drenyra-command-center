export class Document {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        return new Document(props);
    }
    startExtraction() {
        if (this.props.status !== "UPLOADED") {
            throw new Error("Can only start extraction on UPLOADED documents");
        }
        return new Document({
            ...this.props,
            status: "EXTRACTING",
            updatedAt: new Date(),
        });
    }
    completeExtraction(extractedData) {
        if (this.props.status !== "EXTRACTING") {
            throw new Error("Can only complete extraction on EXTRACTING documents");
        }
        const confidenceLevel = this.calculateConfidenceLevel(extractedData.confidenceScore || 0);
        return new Document({
            ...this.props,
            status: "PENDING_VALIDATION",
            extractedData,
            confidenceLevel,
            updatedAt: new Date(),
        });
    }
    validate(validatedBy, notes) {
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
    reject(rejectedBy, reason) {
        return new Document({
            ...this.props,
            status: "REJECTED",
            validatedBy: rejectedBy,
            validatedAt: new Date(),
            validationNotes: reason,
            updatedAt: new Date(),
        });
    }
    startProcessing() {
        if (this.props.status !== "VALIDATED") {
            throw new Error("Can only process VALIDATED documents");
        }
        return new Document({
            ...this.props,
            status: "PROCESSING",
            updatedAt: new Date(),
        });
    }
    completeProcessing(accountingEntryId) {
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
    markAsError(errorMessage) {
        return new Document({
            ...this.props,
            status: "ERROR",
            validationNotes: errorMessage,
            updatedAt: new Date(),
        });
    }
    calculateConfidenceLevel(score) {
        if (score >= 95)
            return "HIGH";
        if (score >= 70)
            return "MEDIUM";
        return "LOW";
    }
    needsReview() {
        return (this.props.confidenceLevel === "MEDIUM" ||
            this.props.confidenceLevel === "LOW");
    }
    canAutoProcess() {
        return (this.props.confidenceLevel === "HIGH" && this.props.fileType === "XML");
    }
    get id() {
        return this.props.id;
    }
    get clientId() {
        return this.props.clientId;
    }
    get clientName() {
        return this.props.clientName;
    }
    get fileName() {
        return this.props.fileName;
    }
    get fileUrl() {
        return this.props.fileUrl;
    }
    get fileType() {
        return this.props.fileType;
    }
    get fileSize() {
        return this.props.fileSize;
    }
    get status() {
        return this.props.status;
    }
    get extractedData() {
        return this.props.extractedData;
    }
    get confidenceLevel() {
        return this.props.confidenceLevel;
    }
    get validatedBy() {
        return this.props.validatedBy;
    }
    get validatedAt() {
        return this.props.validatedAt;
    }
    get validationNotes() {
        return this.props.validationNotes;
    }
    get accountingEntryId() {
        return this.props.accountingEntryId;
    }
    get uploadedAt() {
        return this.props.uploadedAt;
    }
    get processedAt() {
        return this.props.processedAt;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
}
//# sourceMappingURL=Document.js.map