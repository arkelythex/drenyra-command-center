export type DocumentType = "IMAGE" | "XML" | "PDF";
export type DocumentStatus = "UPLOADED" | "EXTRACTING" | "PENDING_VALIDATION" | "VALIDATED" | "PROCESSING" | "PROCESSED" | "REJECTED" | "ERROR";
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
export declare class Document {
    private props;
    private constructor();
    static create(props: DocumentProps): Document;
    startExtraction(): Document;
    completeExtraction(extractedData: ExtractedData): Document;
    validate(validatedBy: string, notes?: string): Document;
    reject(rejectedBy: string, reason: string): Document;
    startProcessing(): Document;
    completeProcessing(accountingEntryId: string): Document;
    markAsError(errorMessage: string): Document;
    private calculateConfidenceLevel;
    needsReview(): boolean;
    canAutoProcess(): boolean;
    get id(): string;
    get clientId(): string;
    get clientName(): string;
    get fileName(): string;
    get fileUrl(): string;
    get fileType(): DocumentType;
    get fileSize(): number;
    get status(): DocumentStatus;
    get extractedData(): ExtractedData | undefined;
    get confidenceLevel(): ConfidenceLevel | undefined;
    get validatedBy(): string | undefined;
    get validatedAt(): Date | undefined;
    get validationNotes(): string | undefined;
    get accountingEntryId(): string | undefined;
    get uploadedAt(): Date;
    get processedAt(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
}
//# sourceMappingURL=Document.d.ts.map