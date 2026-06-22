/**
 * ParsedInvoiceData interface.
 *
 * @example
 * ```ts
 * const value: ParsedInvoiceData = {} as ParsedInvoiceData;
 * console.log(value);
 * ```
 */
export interface ParsedInvoiceData {
	id: string;
	issueDate?: string;
	supplierRuc: string;
	supplierName: string;
	subtotal: number;
	igv: number;
	totalAmount: number;
	currency: string;
}

/**
 * IUBLInvoiceParser interface.
 *
 * @example
 * ```ts
 * const value: IUBLInvoiceParser = {} as IUBLInvoiceParser;
 * console.log(value);
 * ```
 */
export interface IUBLInvoiceParser {
	parseInvoice(xmlContent: string): ParsedInvoiceData;
}

/**
 * OCRInvoiceExtractionOptions interface.
 *
 * @example
 * ```ts
 * const value: OCRInvoiceExtractionOptions = {} as OCRInvoiceExtractionOptions;
 * console.log(value);
 * ```
 */
export interface OCRInvoiceExtractionOptions {
	imageUrl?: string;
	pdfUrl?: string;
}

/**
 * OCRInvoiceData interface.
 *
 * @example
 * ```ts
 * const value: OCRInvoiceData = {} as OCRInvoiceData;
 * console.log(value);
 * ```
 */
export interface OCRInvoiceData {
	series?: string;
	number?: string | number;
	clientRuc?: string;
	clientName?: string;
	issueDate?: string | Date;
	base?: number;
	igv?: number;
	total?: number;
	currency?: string;
	confidence?: number;
}

/**
 * OCRInvoiceExtractionResult interface.
 *
 * @example
 * ```ts
 * const value: OCRInvoiceExtractionResult = {} as OCRInvoiceExtractionResult;
 * console.log(value);
 * ```
 */
export interface OCRInvoiceExtractionResult {
	success: boolean;
	data?: OCRInvoiceData;
	error?: string;
}

/**
 * IInvoiceOCRService interface.
 *
 * @example
 * ```ts
 * const value: IInvoiceOCRService = {} as IInvoiceOCRService;
 * console.log(value);
 * ```
 */
export interface IInvoiceOCRService {
	extractInvoiceData(
		options: OCRInvoiceExtractionOptions,
	): Promise<OCRInvoiceExtractionResult>;
}

/**
 * ExpenseClassificationInput interface.
 *
 * @example
 * ```ts
 * const value: ExpenseClassificationInput = {} as ExpenseClassificationInput;
 * console.log(value);
 * ```
 */
export interface ExpenseClassificationInput {
	itemDescription: string;
	amount: number;
	businessType?: string;
	providerName?: string;
	category?: string;
}

/**
 * ExpenseClassificationResult interface.
 *
 * @example
 * ```ts
 * const value: ExpenseClassificationResult = {} as ExpenseClassificationResult;
 * console.log(value);
 * ```
 */
export interface ExpenseClassificationResult {
	accountCode: string;
	accountName: string;
	confidence: number;
}

/**
 * QuickExpenseClassificationResult interface.
 *
 * @example
 * ```ts
 * const value: QuickExpenseClassificationResult = {} as QuickExpenseClassificationResult;
 * console.log(value);
 * ```
 */
export interface QuickExpenseClassificationResult {
	accountCode: string;
	accountName: string;
}

/**
 * IExpenseClassifier interface.
 *
 * @example
 * ```ts
 * const value: IExpenseClassifier = {} as IExpenseClassifier;
 * console.log(value);
 * ```
 */
export interface IExpenseClassifier {
	classifyExpense(
		input: ExpenseClassificationInput,
	): Promise<ExpenseClassificationResult | null>;
	quickClassify(description: string): QuickExpenseClassificationResult;
}

/**
 * DocumentProcessingPayload interface.
 *
 * @example
 * ```ts
 * const value: DocumentProcessingPayload = {} as DocumentProcessingPayload;
 * console.log(value);
 * ```
 */
export interface DocumentProcessingPayload {
	companyId: string;
	documentId: string;
	fileUrl: string;
	fileType: "PDF" | "IMAGE" | "XML";
	fileName: string;
	clientId: string;
	userId: string;
	timestamp?: number;
}

/**
 * DocumentProcessingResult interface.
 *
 * @example
 * ```ts
 * const value: DocumentProcessingResult = {} as DocumentProcessingResult;
 * console.log(value);
 * ```
 */
export interface DocumentProcessingResult {
	success: boolean;
	documentId: string;
	source: "XML" | "OCR";
	processingTimeMs: number;
	error?: string;
}

/**
 * IDocumentSyncProcessor interface.
 *
 * @example
 * ```ts
 * const value: IDocumentSyncProcessor = {} as IDocumentSyncProcessor;
 * console.log(value);
 * ```
 */
export interface IDocumentSyncProcessor {
	processDocumentSync(
		payload: DocumentProcessingPayload,
	): Promise<DocumentProcessingResult>;
}
