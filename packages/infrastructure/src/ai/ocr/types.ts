/**
 * OCR Types
 *
 * Types for Gemini-powered invoice data extraction
 */

import type { OCRResult } from "../schemas/invoice";

/**
 * OCR extraction options
 * @example
 * ```ts
 * const value: OCROptions = {} as OCROptions;
 * console.log(value);
 * ```
 */

export interface OCROptions {
	/**
	 * Image URL or base64 data
	 */
	imageUrl?: string;

	/**
	 * PDF URL
	 */
	pdfUrl?: string;

	/**
	 * Base64 encoded image/PDF
	 */
	base64Data?: string;

	/**
	 * MIME type (for base64 data)
	 */
	mimeType?: string;

	/**
	 * Organization ID (for context)
	 */
	organizationId?: number;

	/**
	 * Raw file buffer for direct PP-OCRv6 processing
	 */
	file?: Uint8Array;
}

/**
 * OCR Result with metadata
 * @example
 * ```ts
 * const value: OCRResponse = {} as OCRResponse;
 * console.log(value);
 * ```
 */

export interface OCRResponse {
	success: boolean;
	data?: OCRResult | null;
	error?: string;
	cost?: number;
	duration?: number;
	tokensUsed?: {
		input: number;
		output: number;
	};
	/**
	 * Source of the OCR result
	 */
	source?: "ppocr-v6" | "gemini";
	/**
	 * Whether the result needs human review
	 */
	needsReview?: boolean;
	/**
	 * Warnings from the OCR pipeline
	 */
	warnings?: string[];
}
