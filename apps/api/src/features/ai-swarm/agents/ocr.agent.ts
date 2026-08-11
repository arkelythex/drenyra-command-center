/**
 * OCR Agent - Document Data Extraction
 *
 * Extracts structured data from PDF/image invoices using vision models.
 * Uses GPT-4 Vision for best accuracy on Peruvian invoices.
 *
 * @module ai-swarm/agents
 */

import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import {
	estimateCost,
	getModelForAgent,
	hasOpenRouterKey,
	openrouter,
} from "../config/openrouter.config";
import type { AgentResult, InvoiceData } from "../config/types";
import { budgetTracker } from "../tools/budget-tracker";

/**
 * OCR extraction schema
 */
const InvoiceExtractionSchema = z.object({
	ruc: z.string().length(11).describe("RUC del emisor (11 dígitos)"),
	serie: z.string().describe("Serie de la factura (ej: F001)"),
	numero: z.string().describe("Número correlativo"),
	fecha: z.string().describe("Fecha de emisión (ISO format)"),
	moneda: z.enum(["PEN", "USD"]).describe("Moneda"),
	subtotal: z.number().describe("Subtotal sin IGV"),
	igv: z.number().describe("Monto de IGV (18%)"),
	total: z.number().describe("Total incluyendo IGV"),
	items: z
		.array(
			z.object({
				descripcion: z.string(),
				cantidad: z.number(),
				precioUnitario: z.number(),
				subtotal: z.number(),
			}),
		)
		.describe("Items de la factura"),
});

/**
 * OCR Agent
 *
 * Extracts invoice data from documents using vision models
 * @example
 * ```ts
 * const value = new OCRAgent();
 * console.log(value);
 * ```
 */

export class OCRAgent {
	/**
	 * Extract invoice data from image/PDF
	 *
	 * @param imageUrl - URL or base64 data URI of the document
	 * @param invoiceId - Unique identifier for tracking
	 * @returns Extracted invoice data
	 */
	async extractInvoice(
		imageUrl: string,
		invoiceId: string,
	): Promise<AgentResult<InvoiceData>> {
		const startTime = Date.now();

		if (!hasOpenRouterKey()) {
			return {
				success: false,
				error: {
					code: "OCR_NO_API_KEY",
					message:
						"OPENROUTER_API_KEY not configured. OCR agent requires API key.",
				},
				metadata: {
					agentType: "ocr",
					modelUsed: "none",
					tokensUsed: 0,
					costUsd: 0,
					durationMs: Date.now() - startTime,
					timestamp: new Date(),
				},
			};
		}

		try {
			const modelId = getModelForAgent("ocr");
			const model = openrouter(modelId) as unknown as LanguageModel;

			const prompt = `
Eres un experto en OCR de facturas electrónicas peruanas.

Extrae TODOS los datos de la siguiente factura en formato JSON.

IMPORTANTE:
- RUC debe tener exactamente 11 dígitos
- Serie debe ser formato FXXX o BXXX
- Moneda debe ser PEN o USD
- Todos los montos deben ser números, no strings
- IGV debe ser 18% del subtotal
- Total debe ser subtotal + IGV

Si no puedes leer algún campo con certeza, usa estos valores por defecto:
- RUC: "00000000000"
- Serie: "F001"
- Número: "00000001"
- Fecha: fecha actual en ISO format

Devuelve SOLO JSON válido, sin texto adicional.
`;

			const result = await generateObject({
				model,
				schema: InvoiceExtractionSchema,
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: prompt },
							{ type: "image", image: imageUrl },
						],
					},
				],
				temperature: 0.1,
			});

			const invoiceData: InvoiceData = {
				id: invoiceId,
				...result.object,
			};

			const durationMs = Date.now() - startTime;
			const tokensUsed = result.usage.totalTokens ?? 0;
			const costUsd = estimateCost("ocr", tokensUsed);

			if (costUsd > 0 || tokensUsed > 0) {
				budgetTracker.record({
					agentType: "ocr",
					modelUsed: modelId,
					tokensUsed,
					costUsd,
				});
			}

			return {
				success: true,
				data: invoiceData,
				metadata: {
					agentType: "ocr",
					modelUsed: modelId,
					tokensUsed,
					costUsd,
					durationMs,
					timestamp: new Date(),
				},
			};
		} catch (error) {
			const durationMs = Date.now() - startTime;

			return {
				success: false,
				error: {
					code: "OCR_EXTRACTION_FAILED",
					message: error instanceof Error ? error.message : "Unknown error",
					details: error,
				},
				metadata: {
					agentType: "ocr",
					modelUsed: getModelForAgent("ocr"),
					tokensUsed: 0,
					costUsd: 0,
					durationMs,
					timestamp: new Date(),
				},
			};
		}
	}

	/**
	 * Extract multiple invoices in parallel
	 *
	 * @param images - Array of image URLs
	 * @returns Array of extraction results
	 */
	async extractBatch(
		images: Array<{ url: string; id: string }>,
	): Promise<Array<AgentResult<InvoiceData>>> {
		return Promise.all(
			images.map((img) => this.extractInvoice(img.url, img.id)),
		);
	}
}
