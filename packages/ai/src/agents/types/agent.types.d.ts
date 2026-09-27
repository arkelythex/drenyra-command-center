export type AgentRole = "reader" | "parser" | "validator" | "arbitrator";
export type AgentStatus = "idle" | "processing" | "completed" | "error";
export interface BaseAgent {
    id: string;
    role: AgentRole;
    status: AgentStatus;
    process(input: unknown): Promise<unknown>;
}
export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    igvAmount: number;
    totalAmount: number;
    unitCode: string;
}
export interface InvoiceData {
    issuerRuc: string;
    issuerName: string;
    issuerAddress?: string;
    customerRuc: string;
    customerName: string;
    customerDocType: "1" | "6";
    customerAddress?: string;
    invoiceType: "01" | "03" | "07" | "08";
    invoiceNumber: string;
    series: string;
    correlative: string;
    issueDate: Date;
    dueDate?: Date;
    currency: "PEN" | "USD";
    subtotal: number;
    igv: number;
    total: number;
    items: InvoiceItem[];
    observations?: string;
    paymentTerms?: string;
}
export interface ReaderInput {
    type: "invoice_image" | "receipt_photo" | "pdf_scan" | "invoice_xml";
    data: string;
    metadata?: {
        ruc?: string;
        period?: string;
        fileName?: string;
    };
}
export interface ParserInput {
    xmlContent: string;
    schema?: "UBL_2.0" | "UBL_2.1";
    schemaVersion?: "UBL_2.0" | "UBL_2.1";
    readerData?: ExtractedData;
}
export interface ValidatorInput {
    proposedInvoice: InvoiceData;
    complianceYear: number;
    invoiceType: "01" | "03" | "07" | "08";
}
export interface ArbitratorInput {
    reader?: ExtractedData | null;
    parser?: ParsedData | null;
    validator?: ValidationResult | null;
    readerOutput?: ExtractedData | null;
    parserOutput?: ParsedData | null;
    validatorOutput?: ValidationResult | null;
    conflicts: Conflict[];
}
export interface ExtractedData {
    extractedData: InvoiceData;
    confidence: number;
    flags: string[];
    processingTime: number;
    agentId: string;
}
export interface ParsedData {
    parsedData: InvoiceData;
    schemaVersion: string;
    discrepancies: Discrepancy[];
    needsMigration: boolean;
    processingTime: number;
    agentId: string;
}
export interface ValidationResult {
    isCompliant: boolean;
    violations: ComplianceViolation[];
    suggestedFixes: string[];
    generatedXML?: string;
    processingTime: number;
    agentId: string;
}
export interface ArbitrationDecision {
    decision: "APPROVED" | "REJECTED" | "MANUAL_REVIEW";
    finalData: InvoiceData;
    arbitrationLog: {
        conflicts: Conflict[];
        resolutions: Resolution[];
        timestamp: Date;
        arbitratorModel: string;
    };
    confidence: number;
    processingTime: number;
    requiresManualReview?: boolean;
}
export type ParsedInvoice = ParsedData;
export interface Discrepancy {
    field: keyof InvoiceData;
    expectedValue: unknown;
    actualValue: unknown;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
}
export interface ComplianceViolation {
    rule: string;
    description: string;
    field?: string;
    severity: "warning" | "error" | "critical";
    sunatCode?: string;
}
export interface Conflict {
    field: keyof InvoiceData;
    sources: {
        reader?: unknown;
        parser?: unknown;
        validator?: unknown;
    };
    severity: "low" | "medium" | "high";
}
export interface Resolution {
    conflict: Conflict;
    resolvedValue: unknown;
    reasoning: string;
    confidence: number;
    source: "reader" | "parser" | "validator" | "arbitrator" | "external";
}
export interface ProcessedInvoice {
    status: "success" | "failed" | "manual_review";
    invoiceData: InvoiceData;
    xmlContent?: string;
    cdrResponse?: CDRResponse;
    processingLog: ProcessingLog;
    errors?: Error[];
}
export interface ProcessingLog {
    startTime: Date;
    endTime: Date;
    totalTime: number;
    stages: {
        reading: StageLog;
        parsing: StageLog;
        validation: StageLog;
        arbitration?: StageLog;
        xmlGeneration?: StageLog;
        oseSubmission?: StageLog;
    };
}
export interface StageLog {
    startTime: Date;
    endTime: Date;
    duration: number;
    status: "success" | "failed" | "skipped";
    agentId: string;
    output?: unknown;
    error?: string;
}
export interface CDRResponse {
    status: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
    code: string;
    message: string;
    cdrContent: string;
    receivedAt: Date;
}
export interface AIProviderConfig {
    provider: "gemini" | "grok" | "openai";
    model: string;
    apiKey: string;
    maxTokens?: number;
    temperature?: number;
    cacheEnabled?: boolean;
}
export interface AIResponse {
    content: string;
    tokensUsed: {
        input: number;
        output: number;
    };
    cost: number;
    latency: number;
    cached: boolean;
}
//# sourceMappingURL=agent.types.d.ts.map