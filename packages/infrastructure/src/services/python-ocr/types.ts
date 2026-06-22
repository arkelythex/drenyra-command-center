import { z } from "zod";

/**
 * ocrResultSchema const.
 *
 * @example
 * ```ts
 * console.log(ocrResultSchema);
 * ```
 */
export const ocrResultSchema = z.object({
	text: z.string(),
	confidence: z.number().min(0).max(1),
	language: z.string(),
	processing_time_ms: z.number(),
});

/**
 * OCRResult type.
 *
 * @example
 * ```ts
 * const value: OCRResult = {} as OCRResult;
 * console.log(value);
 * ```
 */
export type OCRResult = z.infer<typeof ocrResultSchema>;

const invoiceFieldSchema = z
	.object({
		value: z.string(),
		confidence: z.number().min(0).max(1),
		bounding_box: z.array(z.number()).optional(),
	})
	.nullable();

/**
 * invoiceDataSchema const.
 *
 * @example
 * ```ts
 * console.log(invoiceDataSchema);
 * ```
 */
export const invoiceDataSchema = z.object({
	ruc: invoiceFieldSchema,
	razon_social: invoiceFieldSchema,
	tipo_documento: invoiceFieldSchema,
	serie_numero: invoiceFieldSchema,
	fecha_emision: invoiceFieldSchema,
	fecha_vencimiento: invoiceFieldSchema,
	subtotal: invoiceFieldSchema,
	igv: invoiceFieldSchema,
	total: invoiceFieldSchema,
	moneda: invoiceFieldSchema,
	raw_text: z.string(),
	overall_confidence: z.number(),
	needs_review: z.boolean(),
	warnings: z.array(z.string()),
});

/**
 * InvoiceData type.
 *
 * @example
 * ```ts
 * const value: InvoiceData = {} as InvoiceData;
 * console.log(value);
 * ```
 */
export type InvoiceData = z.infer<typeof invoiceDataSchema>;

/**
 * batchResultSchema const.
 *
 * @example
 * ```ts
 * console.log(batchResultSchema);
 * ```
 */
export const batchResultSchema = z.object({
	total: z.number(),
	successful: z.number(),
	failed: z.number(),
	results: z.array(ocrResultSchema.nullable()),
});

/**
 * BatchResult type.
 *
 * @example
 * ```ts
 * const value: BatchResult = {} as BatchResult;
 * console.log(value);
 * ```
 */
export type BatchResult = z.infer<typeof batchResultSchema>;

/**
 * OCRServiceError class.
 *
 * @example
 * ```ts
 * const value = new OCRServiceError();
 * console.log(value);
 * ```
 */
export class OCRServiceError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public details?: unknown,
	) {
		super(message);
		this.name = "OCRServiceError";
	}
}

/**
 * OCRServiceUnavailable class.
 *
 * @example
 * ```ts
 * const value = new OCRServiceUnavailable();
 * console.log(value);
 * ```
 */
export class OCRServiceUnavailable extends OCRServiceError {
	constructor() {
		super("OCR Service is unavailable");
		this.name = "OCRServiceUnavailable";
	}
}
