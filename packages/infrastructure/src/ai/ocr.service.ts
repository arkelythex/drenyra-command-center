/**
 * OCR Service - Gemini-powered Invoice Data Extraction
 *
 * Uses Gemini 2.5 Flash for fast, cost-effective OCR
 * Extracts structured data from PDF invoices
 */
import { generateObject } from "ai";
import { type OCRResult, OCRResultSchema } from "./schemas/invoice";
import { loggers } from "../logger";
import { getOCRPrompt } from "./prompts";
import { aiRouter } from "./router";

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
	data?: OCRResult;
	error?: string;
	cost?: number;
	duration?: number;
	tokensUsed?: {
		input: number;
		output: number;
	};
}

/**
 * Extract invoice data from an image or PDF using Gemini OCR
 * @param options - Input for options.
 * @returns Result of extractInvoiceData.
 * @example
 * ```ts
 * const result = await extractInvoiceData({} as OCROptions);
 * console.log(result);
 * ```
 */

export async function extractInvoiceData(
	options: OCROptions,
): Promise<OCRResponse> {
	const startTime = Date.now();

	try {
		// Validate input
		if (!options.imageUrl && !options.pdfUrl && !options.base64Data) {
			return {
				success: false,
				error: "Debe proporcionar imageUrl, pdfUrl, o base64Data",
			};
		}

		// Route to appropriate model
		const { model, recordMetrics } = await aiRouter.route("OCR");

		// Prepare the image/PDF content
		const content = prepareContent(options);

		// Call Gemini with structured output
		const result = await generateObject({
			model,
			schema: OCRResultSchema,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: getOCRPrompt(options.pdfUrl ? "pdf" : "image"),
						},
						content,
					],
				},
			],
			temperature: 0.1, // Low temperature for factual extraction
			maxRetries: 2,
		});

		const duration = Date.now() - startTime;

		// Calculate cost (approximate)
		const inputTokens = result.usage?.totalTokens || 0;
		const outputTokens = result.usage?.totalTokens || 0;
		const cost = calculateCost(inputTokens, outputTokens);

		// Record metrics
		recordMetrics(inputTokens, outputTokens, true);

		// Add organization ID if provided
		const data = options.organizationId
			? { ...result.object, organizationId: options.organizationId }
			: result.object;

		return {
			success: true,
			data: data as OCRResult,
			cost,
			duration,
			tokensUsed: {
				input: inputTokens,
				output: outputTokens,
			},
		};
	} catch (error) {
		const duration = Date.now() - startTime;

		loggers.ai.error("OCR error", { error });

		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Error desconocido en OCR",
			duration,
		};
	}
}

/**
 * Prepare content for AI model
 */
function prepareContent(options: OCROptions): { type: "image"; image: string } {
	if (options.imageUrl) {
		return {
			type: "image",
			image: options.imageUrl,
		};
	}

	if (options.pdfUrl) {
		return {
			type: "image",
			image: options.pdfUrl,
		};
	}

	if (options.base64Data) {
		const mimeType = options.mimeType || "image/jpeg";
		const dataUrl = `data:${mimeType};base64,${options.base64Data}`;

		return {
			type: "image",
			image: dataUrl,
		};
	}

	throw new Error("No valid image/PDF source provided");
}

/**
 * Calculate approximate cost
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
	const INPUT_COST_PER_1K = 0.000075; // Gemini Flash pricing
	const OUTPUT_COST_PER_1K = 0.0003;

	const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
	const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;

	return inputCost + outputCost;
}

/**
 * Batch OCR for multiple documents
 * @param documents - Input for documents.
 * @returns Result of batchExtractInvoices.
 * @example
 * ```ts
 * const result = await batchExtractInvoices([]);
 * console.log(result);
 * ```
 */

export async function batchExtractInvoices(
	documents: OCROptions[],
): Promise<OCRResponse[]> {
	loggers.ai.info("Processing documents in batch", { count: documents.length });

	// Process in parallel (max 5 at a time to avoid rate limits)
	const BATCH_SIZE = 5;
	const results: OCRResponse[] = [];

	for (let i = 0; i < documents.length; i += BATCH_SIZE) {
		const batch = documents.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map((doc) => extractInvoiceData(doc)),
		);
		results.push(...batchResults);

		// Small delay between batches to respect rate limits
		if (i + BATCH_SIZE < documents.length) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	const successCount = results.filter((r) => r.success).length;
	const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

	loggers.ai.info("Batch OCR complete", {
		successCount,
		total: documents.length,
		totalCost,
	});

	return results;
}

/**
 * Extract invoice from uploaded file
 * @param file - Input for file.
 * @param organizationId - Input for organizationId.
 * @returns Result of extractFromFile.
 * @example
 * ```ts
 * const result = await extractFromFile({} as File, 0);
 * console.log(result);
 * ```
 */

export async function extractFromFile(
	file: File,
	organizationId?: number,
): Promise<OCRResponse> {
	try {
		// Convert file to base64
		const base64Data = await fileToBase64(file);

		return await extractInvoiceData({
			base64Data,
			mimeType: file.type,
			organizationId,
		});
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Error al procesar archivo",
		};
	}
}

/**
 * Convert File to base64
 */
function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			const result = reader.result as string;
			// Remove data URL prefix (data:image/png;base64,)
			const base64Parts = result.split(",");
			const base64 = base64Parts[1] || "";
			resolve(base64);
		};

		reader.onerror = () => reject(new Error("Error al leer archivo"));
		reader.readAsDataURL(file);
	});
}
