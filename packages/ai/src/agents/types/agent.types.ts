/**
 * Agent Types for Drenyra AI Swarm
 * Defines core interfaces for multi-agent invoice processing
 * @example
 * ```ts
 * const value: AgentRole = {} as AgentRole;
 * console.log(value);
 * ```
 */

export type AgentRole = "reader" | "parser" | "validator" | "arbitrator";

/**
 * AgentStatus type.
 *
 * @example
 * ```ts
 * const value: AgentStatus = {} as AgentStatus;
 * console.log(value);
 * ```
 */
export type AgentStatus = "idle" | "processing" | "completed" | "error";

/**
 * BaseAgent interface.
 *
 * @example
 * ```ts
 * const value: BaseAgent = {} as BaseAgent;
 * console.log(value);
 * ```
 */
export interface BaseAgent {
	id: string;
	role: AgentRole;
	status: AgentStatus;
	process(input: unknown): Promise<unknown>;
}

// ============================================================================
// Invoice Data Structures
// ============================================================================

/**
 * InvoiceItem interface.
 *
 * @example
 * ```ts
 * const value: InvoiceItem = {} as InvoiceItem;
 * console.log(value);
 * ```
 */
export interface InvoiceItem {
	description: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
	igvAmount: number;
	totalAmount: number;
	unitCode: string; // SUNAT unit code (NIU, etc.)
}

/**
 * InvoiceData interface.
 *
 * @example
 * ```ts
 * const value: InvoiceData = {} as InvoiceData;
 * console.log(value);
 * ```
 */
export interface InvoiceData {
	// Issuer (Company)
	issuerRuc: string;
	issuerName: string;
	issuerAddress?: string;

	// Customer
	customerRuc: string;
	customerName: string;
	customerDocType: "1" | "6"; // 1=DNI, 6=RUC
	customerAddress?: string;

	// Invoice metadata
	invoiceType: "01" | "03" | "07" | "08"; // 01=Factura, 03=Boleta, 07=NC, 08=ND
	invoiceNumber: string;
	series: string;
	correlative: string;
	issueDate: Date;
	dueDate?: Date;

	// Amounts
	currency: "PEN" | "USD";
	subtotal: number;
	igv: number;
	total: number;

	// Items
	items: InvoiceItem[];

	// Additional
	observations?: string;
	paymentTerms?: string;
}

// ============================================================================
// Agent Inputs
// ============================================================================

/**
 * ReaderInput interface.
 *
 * @example
 * ```ts
 * const value: ReaderInput = {} as ReaderInput;
 * console.log(value);
 * ```
 */
export interface ReaderInput {
	type: "invoice_image" | "receipt_photo" | "pdf_scan" | "invoice_xml";
	data: string; // base64 encoded
	metadata?: {
		ruc?: string;
		period?: string;
		fileName?: string;
	};
}

/**
 * ParserInput interface.
 *
 * @example
 * ```ts
 * const value: ParserInput = {} as ParserInput;
 * console.log(value);
 * ```
 */
export interface ParserInput {
	xmlContent: string;
	schema?: "UBL_2.0" | "UBL_2.1";
	schemaVersion?: "UBL_2.0" | "UBL_2.1";
	readerData?: ExtractedData;
}

/**
 * ValidatorInput interface.
 *
 * @example
 * ```ts
 * const value: ValidatorInput = {} as ValidatorInput;
 * console.log(value);
 * ```
 */
export interface ValidatorInput {
	proposedInvoice: InvoiceData;
	complianceYear: number;
	invoiceType: "01" | "03" | "07" | "08";
}

/**
 * ArbitratorInput interface.
 *
 * @example
 * ```ts
 * const value: ArbitratorInput = {} as ArbitratorInput;
 * console.log(value);
 * ```
 */
export interface ArbitratorInput {
	reader?: ExtractedData | null;
	parser?: ParsedData | null;
	validator?: ValidationResult | null;
	readerOutput?: ExtractedData | null;
	parserOutput?: ParsedData | null;
	validatorOutput?: ValidationResult | null;
	conflicts: Conflict[];
}

// ============================================================================
// Agent Outputs
// ============================================================================

/**
 * ExtractedData interface.
 *
 * @example
 * ```ts
 * const value: ExtractedData = {} as ExtractedData;
 * console.log(value);
 * ```
 */
export interface ExtractedData {
	extractedData: InvoiceData;
	confidence: number; // 0-1
	flags: string[]; // Issues detected
	processingTime: number; // milliseconds
	agentId: string;
}

/**
 * ParsedData interface.
 *
 * @example
 * ```ts
 * const value: ParsedData = {} as ParsedData;
 * console.log(value);
 * ```
 */
export interface ParsedData {
	parsedData: InvoiceData;
	schemaVersion: string;
	discrepancies: Discrepancy[];
	needsMigration: boolean;
	processingTime: number;
	agentId: string;
}

/**
 * ValidationResult interface.
 *
 * @example
 * ```ts
 * const value: ValidationResult = {} as ValidationResult;
 * console.log(value);
 * ```
 */
export interface ValidationResult {
	isCompliant: boolean;
	violations: ComplianceViolation[];
	suggestedFixes: string[];
	generatedXML?: string;
	processingTime: number;
	agentId: string;
}

/**
 * ArbitrationDecision interface.
 *
 * @example
 * ```ts
 * const value: ArbitrationDecision = {} as ArbitrationDecision;
 * console.log(value);
 * ```
 */
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

/**
 * ParsedInvoice type.
 *
 * @example
 * ```ts
 * const value: ParsedInvoice = {} as ParsedInvoice;
 * console.log(value);
 * ```
 */
export type ParsedInvoice = ParsedData;

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * Discrepancy interface.
 *
 * @example
 * ```ts
 * const value: Discrepancy = {} as Discrepancy;
 * console.log(value);
 * ```
 */
export interface Discrepancy {
	field: keyof InvoiceData;
	expectedValue: unknown;
	actualValue: unknown;
	severity: "low" | "medium" | "high" | "critical";
	message: string;
}

/**
 * ComplianceViolation interface.
 *
 * @example
 * ```ts
 * const value: ComplianceViolation = {} as ComplianceViolation;
 * console.log(value);
 * ```
 */
export interface ComplianceViolation {
	rule: string;
	description: string;
	field?: string;
	severity: "warning" | "error" | "critical";
	sunatCode?: string;
}

/**
 * Conflict interface.
 *
 * @example
 * ```ts
 * const value: Conflict = {} as Conflict;
 * console.log(value);
 * ```
 */
export interface Conflict {
	field: keyof InvoiceData;
	sources: {
		reader?: unknown;
		parser?: unknown;
		validator?: unknown;
	};
	severity: "low" | "medium" | "high";
}

/**
 * Resolution interface.
 *
 * @example
 * ```ts
 * const value: Resolution = {} as Resolution;
 * console.log(value);
 * ```
 */
export interface Resolution {
	conflict: Conflict;
	resolvedValue: unknown;
	reasoning: string;
	confidence: number;
	source: "reader" | "parser" | "validator" | "arbitrator" | "external";
}

// ============================================================================
// Workflow Types
// ============================================================================

/**
 * ProcessedInvoice interface.
 *
 * @example
 * ```ts
 * const value: ProcessedInvoice = {} as ProcessedInvoice;
 * console.log(value);
 * ```
 */
export interface ProcessedInvoice {
	status: "success" | "failed" | "manual_review";
	invoiceData: InvoiceData;
	xmlContent?: string;
	cdrResponse?: CDRResponse;
	processingLog: ProcessingLog;
	errors?: Error[];
}

/**
 * ProcessingLog interface.
 *
 * @example
 * ```ts
 * const value: ProcessingLog = {} as ProcessingLog;
 * console.log(value);
 * ```
 */
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

/**
 * StageLog interface.
 *
 * @example
 * ```ts
 * const value: StageLog = {} as StageLog;
 * console.log(value);
 * ```
 */
export interface StageLog {
	startTime: Date;
	endTime: Date;
	duration: number;
	status: "success" | "failed" | "skipped";
	agentId: string;
	output?: unknown;
	error?: string;
}

/**
 * CDRResponse interface.
 *
 * @example
 * ```ts
 * const value: CDRResponse = {} as CDRResponse;
 * console.log(value);
 * ```
 */
export interface CDRResponse {
	status: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
	code: string;
	message: string;
	cdrContent: string; // base64
	receivedAt: Date;
}

// ============================================================================
// AI Provider Interfaces
// ============================================================================

/**
 * AIProviderConfig interface.
 *
 * @example
 * ```ts
 * const value: AIProviderConfig = {} as AIProviderConfig;
 * console.log(value);
 * ```
 */
export interface AIProviderConfig {
	provider: "gemini" | "grok" | "openai";
	model: string;
	apiKey: string;
	maxTokens?: number;
	temperature?: number;
	cacheEnabled?: boolean;
}

/**
 * AIResponse interface.
 *
 * @example
 * ```ts
 * const value: AIResponse = {} as AIResponse;
 * console.log(value);
 * ```
 */
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
