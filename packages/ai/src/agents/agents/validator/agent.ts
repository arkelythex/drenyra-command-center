/**
 * Validator Agent (Grok Code Fast 1 / OpenRouter)
 * Specialized in SUNAT 2026 compliance validation and XML generation
 *
 * Responsibilities:
 * - Validate invoice data against SUNAT 2026 regulations
 * - Check series format, tax codes, and fiscal rules
 * - Generate compliant UBL 2.1 XML
 * - Suggest fixes for violations
 */

import { randomUUID } from "node:crypto";
import { loggers } from "../../../services/logger";
import type {
	GrokAdapter,
	OpenRouterAdapter,
	RouterAdapter,
} from "../../adapters";
import type {
	BaseAgent,
	ComplianceViolation,
	InvoiceData,
	ValidationResult,
	ValidatorInput,
} from "../../types";
import type { ParsedValidatorResponse } from "./types";
import { INVOICE_TYPE_NAMES, SUNAT_RULES, SYSTEM_PROMPT } from "./types";

/**
 * ValidatorAgent class.
 *
 * @example
 * ```ts
 * const value = new ValidatorAgent();
 * console.log(value);
 * ```
 */
export class ValidatorAgent implements BaseAgent {
	id: string;
	role = "validator" as const;
	status: "idle" | "processing" | "completed" | "error" = "idle";

	private aiAdapter: GrokAdapter | OpenRouterAdapter;
	private routerAdapter?: RouterAdapter;

	constructor(
		aiAdapter: GrokAdapter | OpenRouterAdapter,
		routerAdapter?: RouterAdapter,
	) {
		this.id = `validator-${randomUUID()}`;
		this.aiAdapter = aiAdapter;
		this.routerAdapter = routerAdapter;
	}

	/**
	 * Process invoice validation
	 */
	async process(input: ValidatorInput): Promise<ValidationResult> {
		this.status = "processing";
		const startTime = Date.now();

		try {
			loggers.ai.info("Validator agent processing", {
				invoiceType: input.invoiceType,
			});

			// Pre-validation (fast checks)
			const preViolations = this.preValidate(input.proposedInvoice);

			// AI-powered validation
			const prompt = this.buildPrompt(input);

			let response: import("../../types").AIResponse;
			if (this.routerAdapter) {
				response = await this.routerAdapter.callModel(prompt, {
					capability: "ANALYSIS",
					systemPrompt: SYSTEM_PROMPT,
				});
			} else {
				const messages = [
					{ role: "system" as const, content: SYSTEM_PROMPT },
					{ role: "user" as const, content: prompt },
				];

				response = await this.aiAdapter.complete(messages);
			}

			// Parse response
			const parsed = this.parseResponse(response.content);

			// Combine violations
			const allViolations = [...preViolations, ...parsed.violations];

			const result: ValidationResult = {
				isCompliant: allViolations.length === 0,
				violations: allViolations,
				suggestedFixes: parsed.suggestedFixes || [],
				generatedXML: parsed.generatedXML,
				processingTime: Date.now() - startTime,
				agentId: this.id,
			};

			this.status = "completed";
			loggers.ai.info("Validator agent completed", {
				processingTime: result.processingTime,
				compliant: result.isCompliant,
				violations: result.violations.length,
			});

			return result;
		} catch (error) {
			this.status = "error";
			loggers.ai.error("Validator agent failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Pre-validation (fast, rule-based checks)
	 */
	private preValidate(invoice: InvoiceData): ComplianceViolation[] {
		const violations: ComplianceViolation[] = [];

		// Validate RUC length
		if (invoice.issuerRuc?.length !== SUNAT_RULES.RUC_LENGTH) {
			violations.push({
				rule: "RUC_FORMAT",
				description: `RUC emisor debe tener ${SUNAT_RULES.RUC_LENGTH} dígitos`,
				field: "issuerRuc",
				severity: "critical",
				sunatCode: "2801",
			});
		}

		if (invoice.customerRuc && invoice.customerDocType === "6") {
			if (invoice.customerRuc.length !== SUNAT_RULES.RUC_LENGTH) {
				violations.push({
					rule: "RUC_FORMAT",
					description: `RUC cliente debe tener ${SUNAT_RULES.RUC_LENGTH} dígitos`,
					field: "customerRuc",
					severity: "critical",
					sunatCode: "2802",
				});
			}
		}

		// Validate series format
		const seriesPattern = SUNAT_RULES.SERIES_PATTERNS[invoice.invoiceType];
		if (seriesPattern && !seriesPattern.test(invoice.series)) {
			violations.push({
				rule: "SERIES_FORMAT",
				description: `Serie inválida para tipo ${invoice.invoiceType}`,
				field: "series",
				severity: "critical",
				sunatCode: "2324",
			});
		}

		// Validate IGV calculation using integer math (cents) to avoid floating point errors
		const expectedIGVCents = Math.round(
			invoice.subtotal * 100 * SUNAT_RULES.IGV_RATE,
		);
		const actualIGVCents = Math.round(invoice.igv * 100);
		const TOLERANCE_CENTS = 2; // 2 cents tolerance

		if (Math.abs(expectedIGVCents - actualIGVCents) > TOLERANCE_CENTS) {
			const expectedIGV = expectedIGVCents / 100;
			violations.push({
				rule: "IGV_CALCULATION",
				description: `IGV incorrecto: debe ser 18% del subtotal (${expectedIGV.toFixed(2)})`,
				field: "igv",
				severity: "critical",
				sunatCode: "2810",
			});
		}

		// Validate total using integer math (cents)
		const expectedTotalCents = Math.round(
			(invoice.subtotal + invoice.igv) * 100,
		);
		const actualTotalCents = Math.round(invoice.total * 100);

		if (Math.abs(expectedTotalCents - actualTotalCents) > TOLERANCE_CENTS) {
			const expectedTotal = expectedTotalCents / 100;
			violations.push({
				rule: "TOTAL_CALCULATION",
				description: `Total incorrecto: debe ser subtotal + IGV (${expectedTotal.toFixed(2)})`,
				field: "total",
				severity: "critical",
				sunatCode: "2811",
			});
		}

		// Validate currency
		if (!SUNAT_RULES.CURRENCIES.includes(invoice.currency)) {
			violations.push({
				rule: "CURRENCY_CODE",
				description: `Moneda inválida: debe ser PEN o USD`,
				field: "currency",
				severity: "error",
				sunatCode: "2025",
			});
		}

		return violations;
	}

	/**
	 * Build validation prompt
	 */
	private buildPrompt(input: ValidatorInput): string {
		let prompt = `Valida el siguiente comprobante de pago según normativa SUNAT ${input.complianceYear}.\n\n`;
		prompt += `Tipo de comprobante: ${this.getInvoiceTypeName(input.invoiceType)}\n\n`;
		prompt += `Datos del comprobante:\n\
\
${JSON.stringify(input.proposedInvoice, null, 2)}
\
\
`;
		prompt += `IMPORTANTE: Si es válido, genera el XML UBL 2.1 completo y conforme.\n`;
		prompt += `Si hay violaciones, proporciona fixes específicos.`;

		return prompt;
	}

	/**
	 * Get invoice type name
	 */
	private getInvoiceTypeName(type: string): string {
		return INVOICE_TYPE_NAMES[type] || "Desconocido";
	}

	/**
	 * Parse AI response
	 */
	private parseResponse(response: string): ParsedValidatorResponse {
		try {
			// Remove markdown code blocks if present
			let cleaned = response.trim();
			if (cleaned.startsWith("```json")) {
				cleaned = cleaned.replace(/```json\s*/, "").replace(/```\s*$/, "");
			} else if (cleaned.startsWith("```")) {
				cleaned = cleaned.replace(/```\s*/, "").replace(/```\s*$/, "");
			}

			return JSON.parse(cleaned);
		} catch (error) {
			loggers.ai.error("Validator agent failed to parse response");
			throw new Error(
				`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
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
