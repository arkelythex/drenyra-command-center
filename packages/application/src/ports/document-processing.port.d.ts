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
export interface IUBLInvoiceParser {
	parseInvoice(xmlContent: string): ParsedInvoiceData;
}
export interface OCRInvoiceExtractionOptions {
	imageUrl?: string;
	pdfUrl?: string;
}
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
export interface OCRInvoiceExtractionResult {
	success: boolean;
	data?: OCRInvoiceData;
	error?: string;
}
export interface IInvoiceOCRService {
	extractInvoiceData(
		options: OCRInvoiceExtractionOptions,
	): Promise<OCRInvoiceExtractionResult>;
}
export interface ExpenseClassificationInput {
	itemDescription: string;
	amount: number;
	businessType?: string;
	providerName?: string;
	category?: string;
}
export interface ExpenseClassificationResult {
	accountCode: string;
	accountName: string;
	confidence: number;
}
export interface QuickExpenseClassificationResult {
	accountCode: string;
	accountName: string;
}
export interface IExpenseClassifier {
	classifyExpense(
		input: ExpenseClassificationInput,
	): Promise<ExpenseClassificationResult | null>;
	quickClassify(description: string): QuickExpenseClassificationResult;
}
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
export interface DocumentProcessingResult {
	success: boolean;
	documentId: string;
	source: "XML" | "OCR";
	processingTimeMs: number;
	error?: string;
}
export interface IDocumentSyncProcessor {
	processDocumentSync(
		payload: DocumentProcessingPayload,
	): Promise<DocumentProcessingResult>;
}
//# sourceMappingURL=document-processing.port.d.ts.map
