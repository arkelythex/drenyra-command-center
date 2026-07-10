/**
 * Reader Agent (Gemini Flash - Instance A)
 * Specialized in multimodal extraction from invoices, PDFs, and receipt photos
 *
 * Responsibilities:
 * - OCR of scanned invoices
 * - Extraction of structured data from images
 * - Detection of RUC, amounts, dates, and line items
 * - Flagging inconsistencies and quality issues
 */

import { randomUUID } from "crypto";
import { loggers } from "../../services/logger";
import type { GeminiMultiAdapter } from "../adapters";
import type {
	BaseAgent,
	ExtractedData,
	InvoiceData,
	ReaderInput,
} from "../types";

/**
 * ReaderAgent class.
 *
 * @example
 * ```ts
 * const value = new ReaderAgent();
 * console.log(value);
 * ```
 */
export class ReaderAgent implements BaseAgent {
	id: string;
	role = "reader" as const;
	status: "idle" | "processing" | "completed" | "error" = "idle";

	private gemini: GeminiMultiAdapter;

	// System prompt optimized for Peruvian invoices
	private readonly SYSTEM_PROMPT =
		`Eres un experto contador peruano especializado en facturación electrónica SUNAT.
Tu tarea es extraer TODOS los campos de comprobantes de pago con precisión absoluta.

REGLAS CRÍTICAS:
1. RUC debe tener exactamente 11 dígitos
2. IGV (Impuesto General a las Ventas) es SIEMPRE 18% del subtotal
3. Total = Subtotal + IGV (debe cuadrar matemáticamente)
4. Serie debe seguir formato SUNAT:
   - Facturas: F001-F999
   - Boletas: B001-B999
5. Tipo de documento cliente:
   - RUC (11 dígitos): código '6'
   - DNI (8 dígitos): código '1'
6. Moneda: PEN (Soles) o USD (Dólares)
7. Código de unidad SUNAT (por defecto: NIU = Unidad)

CAMPOS OBLIGATORIOS A EXTRAER:
- Emisor: RUC, razón social
- Cliente: Documento (RUC/DNI), nombre/razón social
- Comprobante: tipo, serie, número, fecha de emisión
- Importes: subtotal, IGV (18%), total
- Items: descripción, cantidad, precio unitario, subtotal, IGV, total

VALIDACIONES:
- Si el subtotal + IGV ≠ total, marca en "flags"
- Si RUC no tiene 11 dígitos, marca en "flags"
- Si IGV ≠ 18% del subtotal, marca en "flags"
- Si faltan campos obligatorios, marca en "flags"

FORMATO DE SALIDA:
Responde SOLO en JSON válido, sin texto adicional, con esta estructura:
{
  "invoiceData": {
    "issuerRuc": "20123456789",
    "issuerName": "EMPRESA SAC",
    "customerRuc": "20987654321",
    "customerName": "CLIENTE SAC",
    "customerDocType": "6",
    "invoiceType": "01",
    "invoiceNumber": "F001-00000123",
    "series": "F001",
    "correlative": "00000123",
    "issueDate": "2026-01-18",
    "currency": "PEN",
    "subtotal": 100.00,
    "igv": 18.00,
    "total": 118.00,
    "items": [
      {
        "description": "Producto/Servicio",
        "quantity": 1,
        "unitPrice": 100.00,
        "subtotal": 100.00,
        "igvAmount": 18.00,
        "totalAmount": 118.00,
        "unitCode": "NIU"
      }
    ]
  },
  "confidence": 0.95,
  "flags": []
}`;

	constructor(gemini: GeminiMultiAdapter) {
		this.id = `reader-${randomUUID()}`;
		this.gemini = gemini;
	}

	/**
	 * Process invoice image/PDF
	 */
	async process(input: ReaderInput): Promise<ExtractedData> {
		this.status = "processing";
		const startTime = Date.now();

		try {
			loggers.ai.info("Reader agent processing", { inputType: input.type });

			const prompt = this.buildPrompt(input);

			const response = await this.gemini.generate({
				text: prompt,
				images: [input.data],
				systemInstruction: this.SYSTEM_PROMPT,
			});

			// Parse JSON response
			const parsed = this.parseResponse(response.content);

			// Validate extracted data
			const flags = this.validate(parsed.invoiceData);

			const result: ExtractedData = {
				extractedData: parsed.invoiceData,
				confidence: parsed.confidence || 0.8,
				flags: [...(parsed.flags || []), ...flags],
				processingTime: Date.now() - startTime,
				agentId: this.id,
			};

			this.status = "completed";
			loggers.ai.info("Reader agent completed", {
				processingTime: result.processingTime,
				confidence: result.confidence,
			});

			return result;
		} catch (error) {
			this.status = "error";
			loggers.ai.error("Reader agent failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Build extraction prompt
	 */
	private buildPrompt(input: ReaderInput): string {
		const hints = [];

		if (input.metadata?.ruc) {
			hints.push(`RUC esperado del emisor: ${input.metadata.ruc}`);
		}

		if (input.metadata?.period) {
			hints.push(`Período: ${input.metadata.period}`);
		}

		const basePrompt = `Extrae todos los campos del comprobante de pago en la imagen.`;

		if (hints.length > 0) {
			return `${basePrompt}\n\nPistas adicionales:\n${hints.join("\n")}`;
		}

		return basePrompt;
	}

	/**
	 * Parse AI response to structured data
	 */
	private parseResponse(response: string): {
		invoiceData: InvoiceData;
		confidence: number;
		flags: string[];
	} {
		try {
			// Remove markdown code blocks if present
			let cleaned = response.trim();
			if (cleaned.startsWith("```json")) {
				cleaned = cleaned.replace(/```json\s*/, "").replace(/```\s*$/, "");
			} else if (cleaned.startsWith("```")) {
				cleaned = cleaned.replace(/```\s*/, "").replace(/```\s*$/, "");
			}

			const parsed = JSON.parse(cleaned);

			// Convert issueDate string to Date object
			if (parsed.invoiceData?.issueDate) {
				parsed.invoiceData.issueDate = new Date(parsed.invoiceData.issueDate);
			}

			return parsed;
		} catch (error) {
			loggers.ai.error("Reader agent failed to parse response");
			throw new Error(
				`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Validate extracted data
	 */
	private validate(data: InvoiceData): string[] {
		const flags: string[] = [];

		// Validate RUC length
		if (data.issuerRuc && data.issuerRuc.length !== 11) {
			flags.push(
				`RUC emisor inválido: ${data.issuerRuc} (debe tener 11 dígitos)`,
			);
		}

		if (
			data.customerRuc &&
			data.customerRuc.length !== 11 &&
			data.customerDocType === "6"
		) {
			flags.push(
				`RUC cliente inválido: ${data.customerRuc} (debe tener 11 dígitos)`,
			);
		}

		// Validate IGV calculation (18%) using integer math (cents) to avoid floating point errors
		const expectedIGVCents = Math.round(data.subtotal * 100 * 0.18);
		const actualIGVCents = Math.round(data.igv * 100);
		const TOLERANCE_CENTS = 2; // 2 cents tolerance

		if (Math.abs(expectedIGVCents - actualIGVCents) > TOLERANCE_CENTS) {
			const expectedIGV = (expectedIGVCents / 100).toFixed(2);
			const actualIGV = (actualIGVCents / 100).toFixed(2);
			flags.push(
				`IGV incorrecto: esperado ${expectedIGV} (18% de ${data.subtotal}), encontrado ${actualIGV}`,
			);
		}

		// Validate total using integer math (cents)
		const expectedTotalCents = Math.round((data.subtotal + data.igv) * 100);
		const actualTotalCents = Math.round(data.total * 100);

		if (Math.abs(expectedTotalCents - actualTotalCents) > TOLERANCE_CENTS) {
			const expectedTotal = (expectedTotalCents / 100).toFixed(2);
			const actualTotal = (actualTotalCents / 100).toFixed(2);
			flags.push(
				`Total incorrecto: esperado ${expectedTotal} (subtotal + IGV), encontrado ${actualTotal}`,
			);
		}

		// Validate invoice series format
		if (data.series) {
			const seriesPattern = /^[FB]\d{3}$/;
			if (!seriesPattern.test(data.series)) {
				flags.push(
					`Serie inválida: ${data.series} (debe ser F001-F999 o B001-B999)`,
				);
			}
		}

		// Validate required fields
		const requiredFields: (keyof InvoiceData)[] = [
			"issuerRuc",
			"issuerName",
			"customerName",
			"invoiceNumber",
			"issueDate",
			"subtotal",
			"igv",
			"total",
		];

		for (const field of requiredFields) {
			if (!data[field]) {
				flags.push(`Campo obligatorio faltante: ${field}`);
			}
		}

		return flags;
	}

	/**
	 * Get agent info
	 */
	getInfo(): { id: string; role: string; status: string } {
		return {
			id: this.id,
			role: this.role,
			status: this.status,
		};
	}
}
