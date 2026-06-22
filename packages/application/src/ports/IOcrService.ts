/**
 * OCR extraction options for the OCR port.
 *
 * @example
 * ```ts
 * const opts: OCROptions = { imageUrl: "https://example.com/invoice.png" };
 * ```
 */
export interface OCROptions {
	imageUrl?: string;
	imageBuffer?: Buffer;
	pdfUrl?: string;
	xmlContent?: string;
	model?: "gemini-flash" | "gemini-pro";
}

/**
 * Normalized invoice data extracted from OCR/XML processing.
 *
 * @example
 * ```ts
 * const data: InvoiceData = { series: "F001", number: 1234, currency: "PEN" };
 * ```
 */
export interface InvoiceData {
	series?: string;
	number?: number;
	issueDate?: Date;
	clientName?: string;
	clientRUC?: string;
	clientDNI?: string;
	baseAmount?: number;
	igvAmount?: number;
	totalAmount?: number;
	currency?: "PEN" | "USD";
	items?: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
	}>;
}

/**
 * Result returned by {@link IOcrService.extract}.
 *
 * @example
 * ```ts
 * const result: OcrResult = { success: true, data: { series: "F001", number: 1234 } };
 * ```
 */
export interface OcrResult {
	success: boolean;
	data?: Partial<InvoiceData>;
	error?: string;
	cost?: number;
	duration?: number;
}

/**
 * OCR service port for extracting invoice data from different inputs (image/pdf/xml).
 *
 * @example
 * ```ts
 * const ocr: IOcrService = getOcrService();
 * const result = await ocr.extract({ imageUrl: "https://example.com/invoice.png" });
 * ```
 */
export interface IOcrService {
	extract(options: OCROptions): Promise<OcrResult>;
}
