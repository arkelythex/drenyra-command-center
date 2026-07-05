/**
 * SUNAT Agent - SUNAT Compliance Validation
 *
 * Validates Peruvian invoices against SUNAT 2026 regulations:
 * - RUC validation (Módulo 11)
 * - IGV calculation (18%)
 * - UBL 2.1 structure
 * - SIRE compliance
 *
 * Uses hybrid approach:
 * 1. Rule-based validation (fast, deterministic)
 * 2. AI validation (contextual, edge cases)
 *
 * @module ai-swarm/agents
 */

import { RUC } from "@drenyra/domain";
import { generateObject } from "ai";
import { z } from "zod";
import { createLogger } from "../../../lib/logger";
import {
	estimateCost,
	getModelForAgent,
	hasOpenRouterKey,
	openrouter,
} from "../config/openrouter.config";
import type {
	AgentResult,
	InvoiceData,
	ValidationError,
	ValidationResult,
	ValidationWarning,
} from "../config/types";
import {
	buildPolicyWarnings2026,
	buildSunatRagContext,
	getPeruRulePack2026,
	mapParityAlertsToValidation,
	runSunatAiParitySubagent,
} from "../rules/peru-2026";
import { budgetTracker } from "../tools/budget-tracker";
import { agentCache } from "../tools/cache";

const logger = createLogger({ module: "ai-swarm/sunat-agent" });

/**
 * Loaded rule pack (Task 1.1 - Peru business rules 2026)
 */
const PERU_RULE_PACK = getPeruRulePack2026();

/**
 * Validation result schema for AI response
 */
const ValidationSchema = z.object({
	isValid: z.boolean(),
	errors: z.array(
		z.object({
			field: z.string(),
			code: z.string(),
			message: z.string(),
			severity: z.enum(["error", "critical"]),
		}),
	),
	warnings: z.array(
		z.object({
			field: z.string(),
			code: z.string(),
			message: z.string(),
			suggestion: z.string().optional(),
		}),
	),
	confidence: z.number().min(0).max(1),
});

/**
 * SUNAT Agent
 *
 * Validates invoices with hybrid rule-based + AI approach
 * @example
 * ```ts
 * const value = new SUNATAgent();
 * console.log(value);
 * ```
 */

export class SUNATAgent {
	/**
	 * Validate invoice against SUNAT regulations
	 *
	 * @param invoice - Invoice data to validate
	 * @returns Validation result with errors and warnings
	 */
	async validateInvoice(
		invoice: InvoiceData,
	): Promise<AgentResult<ValidationResult>> {
		const startTime = Date.now();

		try {
			// Step 1: Rule-based validation (fast, deterministic)
			const { errors: ruleErrors, warnings: ruleWarnings } =
				this.validateWithRules(invoice);

			// Step 2: AI validation (contextual checks)
			const ai = await this.validateWithAI(invoice);

			// Step 3: Merge results
			const allErrors = [...ruleErrors, ...ai.validation.errors];
			const result: ValidationResult = {
				isValid: allErrors.length === 0,
				errors: allErrors,
				warnings: [...ruleWarnings, ...ai.validation.warnings],
				confidence: allErrors.length === 0 ? ai.validation.confidence : 0,
			};

			const durationMs = Date.now() - startTime;

			if (ai.costUsd > 0 || ai.tokensUsed > 0) {
				budgetTracker.record({
					agentType: "sunat",
					modelUsed: ai.modelUsed,
					tokensUsed: ai.tokensUsed,
					costUsd: ai.costUsd,
				});
			}

			return {
				success: true,
				data: result,
				metadata: {
					agentType: "sunat",
					modelUsed: ai.modelUsed,
					tokensUsed: ai.tokensUsed,
					costUsd: ai.costUsd,
					durationMs,
					timestamp: new Date(),
				},
			};
		} catch (error) {
			const durationMs = Date.now() - startTime;

			return {
				success: false,
				error: {
					code: "SUNAT_VALIDATION_FAILED",
					message: error instanceof Error ? error.message : "Unknown error",
					details: error,
				},
				metadata: {
					agentType: "sunat",
					modelUsed: getModelForAgent("sunat"),
					tokensUsed: 0,
					costUsd: 0,
					durationMs,
					timestamp: new Date(),
				},
			};
		}
	}

	/**
	 * Rule-based validation (deterministic)
	 *
	 * Validates:
	 * - RUC format and checksum
	 * - IGV calculation
	 * - Required fields
	 * - Number formats
	 */
	private validateWithRules(invoice: InvoiceData): {
		errors: ValidationError[];
		warnings: ValidationWarning[];
	} {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Validate RUC (11 digits, Módulo 11)
		if (!this.isValidRUC(invoice.ruc)) {
			errors.push({
				field: "ruc",
				code: "INVALID_RUC",
				message: `RUC ${invoice.ruc} no es válido (Módulo 11)`,
				severity: "critical",
			});
		}

		// Validate IGV calculation (18%)
		const expectedIGV =
			Math.round(invoice.subtotal * PERU_RULE_PACK.thresholds.igvRate * 100) /
			100;
		if (
			Math.abs(invoice.igv - expectedIGV) >
			PERU_RULE_PACK.thresholds.amountTolerancePen
		) {
			errors.push({
				field: "igv",
				code: "INVALID_IGV",
				message: `IGV incorrecto. Esperado: S/ ${expectedIGV}, Recibido: S/ ${invoice.igv}`,
				severity: "error",
			});
		}

		// Validate total = subtotal + IGV
		const expectedTotal = invoice.subtotal + invoice.igv;
		if (
			Math.abs(invoice.total - expectedTotal) >
			PERU_RULE_PACK.thresholds.amountTolerancePen
		) {
			errors.push({
				field: "total",
				code: "INVALID_TOTAL",
				message: `Total incorrecto. Esperado: S/ ${expectedTotal}, Recibido: S/ ${invoice.total}`,
				severity: "error",
			});
		}

		// Validate serie format (FXXX-XXXXXXXX for electronic invoices)
		if (!/^[FB]\d{3}-\d{8}$/.test(`${invoice.serie}-${invoice.numero}`)) {
			errors.push({
				field: "serie",
				code: "INVALID_SERIE_FORMAT",
				message: `Serie ${invoice.serie}-${invoice.numero} no cumple formato SUNAT`,
				severity: "error",
			});
		}

		const parity = runSunatAiParitySubagent(invoice);
		const parityValidation = mapParityAlertsToValidation(parity.alerts);
		errors.push(...parityValidation.errors);
		warnings.push(...parityValidation.warnings);
		warnings.push(...buildPolicyWarnings2026(invoice));

		return {
			errors: dedupeErrors(errors),
			warnings: dedupeWarnings(warnings),
		};
	}

	/**
	 * AI-based validation (contextual)
	 *
	 * Uses Gemini Flash for:
	 * - Edge cases (e.g., detracción logic)
	 * - Contextual warnings (e.g., bancarización threshold)
	 * - Complex scenarios
	 */
	private async validateWithAI(invoice: InvoiceData): Promise<{
		validation: ValidationResult;
		modelUsed: string;
		tokensUsed: number;
		costUsd: number;
	}> {
		if (!hasOpenRouterKey()) {
			return {
				validation: {
					isValid: true,
					errors: [],
					warnings: [],
					confidence: 0,
				},
				modelUsed: "none",
				tokensUsed: 0,
				costUsd: 0,
			};
		}

		const cacheInput = {
			ruc: invoice.ruc,
			serie: invoice.serie,
			numero: invoice.numero,
			fecha: invoice.fecha,
			moneda: invoice.moneda,
			subtotal: invoice.subtotal,
			igv: invoice.igv,
			total: invoice.total,
			items: invoice.items,
		};

		const cached = agentCache.get<ValidationResult>("sunat-ai", cacheInput);
		if (cached) {
			return {
				validation: cached,
				modelUsed: "cache",
				tokensUsed: 0,
				costUsd: 0,
			};
		}

		const modelId = getModelForAgent("sunat");
		const model = openrouter(modelId);
		const ragContext = buildSunatRagContext(invoice);

		const prompt = `
Eres un experto en normativa SUNAT 2026 (Perú).

Valida la siguiente factura contra las reglas de SUNAT:

RUC: ${invoice.ruc}
Serie-Número: ${invoice.serie}-${invoice.numero}
Fecha: ${invoice.fecha}
Moneda: ${invoice.moneda}
Subtotal: ${invoice.subtotal}
IGV (18%): ${invoice.igv}
Total: ${invoice.total}

Items:
${invoice.items.map((item, i) => `${i + 1}. ${item.descripcion} - ${item.cantidad} x S/ ${item.precioUnitario}`).join("\n")}

Verifica:
1. ¿Requiere detracción? (servicios >= S/ ${PERU_RULE_PACK.thresholds.detraccionMinimumPen})
2. ¿Requiere bancarización? (total >= S/ ${PERU_RULE_PACK.thresholds.defaultBancarizacionMinimumPen})
3. ¿Hay inconsistencias sospechosas?
4. ¿Falta información obligatoria?
5. ¿Hay alertas de transición SIRE (periodos desde ${PERU_RULE_PACK.thresholds.sireMandatoryFrom})?

Contexto obligatorio para evitar alucinaciones:
${ragContext}

Devuelve SOLO JSON válido, sin texto adicional.
`;

		try {
			const result = await generateObject({
				model,
				schema: ValidationSchema,
				prompt,
				temperature: 0.1,
			});

			const validation = result.object;
			const tokensUsed = result.usage.totalTokens ?? 0;
			const costUsd = estimateCost("sunat", tokensUsed);

			agentCache.set("sunat-ai", cacheInput, validation, costUsd);

			return {
				validation,
				modelUsed: modelId,
				tokensUsed,
				costUsd,
			};
		} catch (error) {
			logger.error({ error }, "AI validation failed");
			// Return empty result if AI fails
			return {
				validation: {
					isValid: true,
					errors: [],
					warnings: [],
					confidence: 0,
				},
				modelUsed: getModelForAgent("sunat"),
				tokensUsed: 0,
				costUsd: 0,
			};
		}
	}

	/**
	 * Validate RUC using Módulo 11
	 *
	 * @param ruc - RUC to validate (11 digits)
	 * @returns true if valid
	 */
	private isValidRUC(ruc: string): boolean {
		return RUC.isValid(ruc);
	}
}

function dedupeErrors(errors: ValidationError[]): ValidationError[] {
	const seen = new Set<string>();
	return errors.filter((error) => {
		const key = `${error.field}:${error.code}:${error.message}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function dedupeWarnings(warnings: ValidationWarning[]): ValidationWarning[] {
	const seen = new Set<string>();
	return warnings.filter((warning) => {
		const key = `${warning.field}:${warning.code}:${warning.message}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
