import {
	ocrResultSchema,
	invoiceDataSchema,
	batchResultSchema,
	OCRServiceError,
	OCRServiceUnavailable,
	type OCRResult,
	type InvoiceData,
	type BatchResult,
} from "./types";

// ============================================
// Configuration
// ============================================

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://localhost:8001";
const OCR_SERVICE_TIMEOUT = parseInt(
	process.env.OCR_SERVICE_TIMEOUT || "30000",
	10,
);

// ============================================
// Client Class
// ============================================

/**
 * PythonOCRClient class.
 *
 * @example
 * ```ts
 * const value = new PythonOCRClient();
 * console.log(value);
 * ```
 */
export class PythonOCRClient {
	private baseUrl: string;
	private timeout: number;

	constructor(baseUrl?: string, timeout?: number) {
		this.baseUrl = baseUrl || OCR_SERVICE_URL;
		this.timeout = timeout || OCR_SERVICE_TIMEOUT;
	}

	/**
	 * Check if OCR service is healthy
	 */
	async isHealthy(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Extract text from an image
	 */
	async extractText(imageBuffer: Uint8Array | ArrayBuffer): Promise<OCRResult> {
		const formData = new FormData();
		const data =
			imageBuffer instanceof Uint8Array
				? imageBuffer
				: new Uint8Array(imageBuffer);
		const blob = new Blob([data as BlobPart]);
		formData.append("file", blob, "image.jpg");

		const response = await this.makeRequest("/v1/ocr/extract", formData);

		const validated = ocrResultSchema.safeParse(response);
		if (!validated.success) {
			throw new OCRServiceError(
				"Invalid response from OCR service",
				undefined,
				validated.error,
			);
		}

		return validated.data;
	}

	/**
	 * Extract structured invoice data from an image
	 */
	async extractInvoice(
		imageBuffer: Uint8Array | ArrayBuffer,
	): Promise<InvoiceData> {
		const formData = new FormData();
		const data =
			imageBuffer instanceof Uint8Array
				? imageBuffer
				: new Uint8Array(imageBuffer);
		const blob = new Blob([data as unknown as BlobPart]);
		formData.append("file", blob, "invoice.jpg");

		const response = await this.makeRequest(
			"/v1/ocr/extract-invoice",
			formData,
		);

		const validated = invoiceDataSchema.safeParse(response);
		if (!validated.success) {
			throw new OCRServiceError(
				"Invalid invoice response",
				undefined,
				validated.error,
			);
		}

		return validated.data;
	}

	/**
	 * Process multiple images in batch
	 */
	async batchExtract(
		imageBuffers: (Uint8Array | ArrayBuffer)[],
	): Promise<BatchResult> {
		const formData = new FormData();

		imageBuffers.forEach((buffer, index) => {
			const data =
				buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
			const blob = new Blob([data as unknown as BlobPart]);
			formData.append("files", blob, `image_${index}.jpg`);
		});

		const response = await this.makeRequest("/v1/ocr/batch", formData);

		const validated = batchResultSchema.safeParse(response);
		if (!validated.success) {
			throw new OCRServiceError(
				"Invalid batch response",
				undefined,
				validated.error,
			);
		}

		return validated.data;
	}

	/**
	 * Extract text from a PDF file
	 */
	async extractPDF(pdfBuffer: Uint8Array | ArrayBuffer): Promise<{
		text: string;
		page_count: number;
		has_images: boolean;
		metadata: Record<string, unknown>;
	}> {
		const formData = new FormData();
		const data =
			pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
		const blob = new Blob([data as unknown as BlobPart], {
			type: "application/pdf",
		});
		formData.append("file", blob, "document.pdf");

		return this.makeRequest("/v1/documents/pdf/extract", formData) as Promise<{
			text: string;
			page_count: number;
			has_images: boolean;
			metadata: Record<string, unknown>;
		}>;
	}

	/**
	 * Parse SUNAT XML invoice
	 */
	async parseXML(xmlContent: string): Promise<{
		emisor_ruc: string | null;
		emisor_razon_social: string | null;
		receptor_ruc: string | null;
		receptor_razon_social: string | null;
		tipo_documento: string | null;
		serie: string | null;
		numero: string | null;
		fecha_emision: string | null;
		subtotal_cents: number | null;
		igv_cents: number | null;
		total_cents: number | null;
		moneda: string | null;
		items: unknown[];
		is_valid: boolean;
		validation_errors: string[];
	}> {
		const formData = new FormData();
		const blob = new Blob([xmlContent], { type: "application/xml" });
		formData.append("file", blob, "invoice.xml");

		return this.makeRequest("/v1/documents/xml/parse", formData) as Promise<{
			emisor_ruc: string | null;
			emisor_razon_social: string | null;
			receptor_ruc: string | null;
			receptor_razon_social: string | null;
			tipo_documento: string | null;
			serie: string | null;
			numero: string | null;
			fecha_emision: string | null;
			subtotal_cents: number | null;
			igv_cents: number | null;
			total_cents: number | null;
			moneda: string | null;
			items: unknown[];
			is_valid: boolean;
			validation_errors: string[];
		}>;
	}

	/**
	 * Classify document type
	 */
	async classifyDocument(
		fileBuffer: Uint8Array | ArrayBuffer,
		filename: string,
	): Promise<{
		document_type: string;
		confidence: number;
		suggested_action: string;
	}> {
		const formData = new FormData();
		const data =
			fileBuffer instanceof Uint8Array
				? fileBuffer
				: new Uint8Array(fileBuffer);
		const blob = new Blob([data as unknown as BlobPart]);
		formData.append("file", blob, filename);

		return this.makeRequest("/v1/documents/classify", formData) as Promise<{
			document_type: string;
			confidence: number;
			suggested_action: string;
		}>;
	}

	// ============================================
	// Private Methods
	// ============================================

	private async makeRequest(
		endpoint: string,
		formData: FormData,
	): Promise<unknown> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				method: "POST",
				body: formData,
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new OCRServiceError(
					`OCR service error: ${response.statusText}`,
					response.status,
					errorText,
				);
			}

			return response.json();
		} catch (error) {
			if (error instanceof OCRServiceError) {
				throw error;
			}

			if (error instanceof TypeError && error.message.includes("fetch")) {
				throw new OCRServiceUnavailable();
			}

			throw new OCRServiceError(
				`OCR request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

// ============================================
// Singleton Instance
// ============================================

/**
 * pythonOCR const.
 *
 * @example
 * ```ts
 * console.log(pythonOCR);
 * ```
 */
export const pythonOCR = new PythonOCRClient();

// ============================================
// Convenience Functions
// ============================================

/**
 * Quick OCR extraction with fallback to Node.js AI if Python service unavailable
 * @param imageBuffer - Input for imageBuffer.
 * @returns Result of extractTextWithFallback.
 * @throws Error when extractTextWithFallback cannot complete successfully.
 * @example
 * ```ts
 * const result = await extractTextWithFallback({} as Uint8Array);
 * console.log(result);
 * ```
 */

export async function extractTextWithFallback(
	imageBuffer: Uint8Array | ArrayBuffer,
): Promise<OCRResult> {
	try {
		return await pythonOCR.extractText(imageBuffer);
	} catch (error) {
		if (error instanceof OCRServiceUnavailable) {
			// TODO: Fallback to Gemini Flash OCR
			console.warn(
				"[OCR Fallback] Python service unavailable, using AI fallback",
			);
			throw new Error("OCR fallback not implemented yet");
		}
		throw error;
	}
}

/**
 * Check OCR service status for health monitoring
 * @returns Result of getOCRServiceStatus.
 * @example
 * ```ts
 * const result = await getOCRServiceStatus();
 * console.log(result);
 * ```
 */

export async function getOCRServiceStatus(): Promise<{
	available: boolean;
	latency_ms?: number;
}> {
	const start = Date.now();
	const available = await pythonOCR.isHealthy();
	return {
		available,
		latency_ms: available ? Date.now() - start : undefined,
	};
}
