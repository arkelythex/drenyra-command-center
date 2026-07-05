/**
 * Validation Service - Claude-powered Invoice Validation
 *
 * Uses Claude 3.5 Sonnet for complex business rule validation
 * Provides detailed error messages and correction suggestions
 */

import type { InvoiceData } from "@drenyra/application/ports/IOcrService";
import type {
	AdvisoryValidationResult,
	DeterministicValidationResult,
	IValidationService,
} from "@drenyra/application/ports/IValidationService";
import { generateObject } from "ai";
import { z } from "zod";
import { loggers } from "../logger";
import { getValidationPrompt } from "./prompts";
import { aiRouter } from "./router";
import { type Invoice, validateInvoice } from "./schemas/invoice";

/**
 * Validation error severity
 * @example
 * ```ts
 * const value: ErrorSeverity = {} as ErrorSeverity;
 * console.log(value);
 * ```
 */

export type ErrorSeverity = "CRITICAL" | "WARNING" | "INFO";

/**
 * Validation error details
 * @example
 * ```ts
 * const value: ValidationError = {} as ValidationError;
 * console.log(value);
 * ```
 */

export interface ValidationError {
	field: string;
	message: string;
	severity: ErrorSeverity;
	currentValue?: unknown;
	expectedValue?: unknown;
	suggestion?: string;
}

/**
 * AI Validation Result Schema
 */
const AIValidationResultSchema = z.object({
	isValid: z.boolean(),
	errors: z.array(
		z.object({
			field: z.string(),
			message: z.string(),
			severity: z.enum(["CRITICAL", "WARNING", "INFO"]),
			currentValue: z.unknown().optional(),
			expectedValue: z.unknown().optional(),
			suggestion: z.string().optional(),
		}),
	),
	suggestions: z.array(
		z.object({
			field: z.string(),
			suggestion: z.string(),
			confidence: z.number().min(0).max(1),
		}),
	),
	confidence: z.number().min(0).max(1),
});

/**
 * Validation response
 * @example
 * ```ts
 * const value: ValidationResponse = {} as ValidationResponse;
 * console.log(value);
 * ```
 */

export interface ValidationResponse {
	success: boolean;
	isValid: boolean;
	errors: ValidationError[];
	suggestions?: Array<{
		field: string;
		suggestion: string;
		confidence: number;
	}>;
	confidence?: number;
	cost?: number;
	duration?: number;
}

/**
 * Validate invoice with Claude AI
 *
 * This performs deep validation beyond simple schema checks:
 * - Business rule validation
 * - Contextual error detection
 * - Intelligent suggestions
 * @param invoice - Input for invoice.
 * @returns Result of validateInvoiceWithAI.
 * @example
 * ```ts
 * const result = await validateInvoiceWithAI(undefined);
 * console.log(result);
 * ```
 */

export async function validateInvoiceWithAI(
	invoice: unknown,
): Promise<ValidationResponse> {
	const startTime = Date.now();

	try {
		// First, run Zod validation (fast, local)
		const zodResult = validateInvoice(invoice);

		// If Zod validation fails critically, return early
		if (!zodResult.isValid && zodResult.errors) {
			const criticalErrors = zodResult.errors.filter(
				(err) =>
					err.code === "invalid_type" ||
					err.path.includes("clientRuc") ||
					err.path.includes("series") ||
					err.path.includes("number"),
			);

			if (criticalErrors.length > 0) {
				return {
					success: true,
					isValid: false,
					errors: criticalErrors.map((err) => ({
						field: err.path.join("."),
						message: err.message,
						severity: "CRITICAL" as ErrorSeverity,
					})),
					duration: Date.now() - startTime,
				};
			}
		}

		// Route to Claude for deep validation
		const { model, recordMetrics } = await aiRouter.route("VALIDATION");

		// Call Claude with structured output
		const result = await generateObject({
			model,
			schema: AIValidationResultSchema,
			prompt: getValidationPrompt(invoice),
			temperature: 0.2, // Low temperature for consistent validation
			maxRetries: 2,
		});

		const duration = Date.now() - startTime;
		const inputTokens = result.usage?.totalTokens || 0;
		const outputTokens = result.usage?.totalTokens || 0;
		const cost = calculateValidationCost(inputTokens, outputTokens);

		// Record metrics
		recordMetrics(inputTokens, outputTokens, true);

		const aiResult = result.object;

		return {
			success: true,
			isValid: aiResult.isValid,
			errors: aiResult.errors as ValidationError[],
			suggestions: aiResult.suggestions as ValidationResponse["suggestions"],
			confidence: aiResult.confidence,
			cost,
			duration,
		};
	} catch (error) {
		const duration = Date.now() - startTime;

		loggers.validation.error("Validation error", { error });

		return {
			success: false,
			isValid: false,
			errors: [
				{
					field: "general",
					message:
						error instanceof Error
							? error.message
							: "Error desconocido en validación",
					severity: "CRITICAL",
				},
			],
			duration,
		};
	}
}

/**
 * Quick validation (Zod only, no AI)
 * Use this for real-time feedback while user types
 * @param invoice - Input for invoice.
 * @returns Result of quickValidate.
 * @example
 * ```ts
 * const result = quickValidate(undefined);
 * console.log(result);
 * ```
 */

export function quickValidate(invoice: unknown): {
	isValid: boolean;
	errors: ValidationError[];
} {
	const result = validateInvoice(invoice);

	if (result.isValid) {
		return { isValid: true, errors: [] };
	}

	return {
		isValid: false,
		errors:
			result.errors?.map((err) => ({
				field: err.path.join("."),
				message: err.message,
				severity: determineSeverity(err),
			})) || [],
	};
}

/**
 * Determine error severity from Zod error
 */
function determineSeverity(error: z.ZodIssue): ErrorSeverity {
	// Critical errors that prevent invoice from being valid
	const criticalPaths = [
		"type",
		"series",
		"number",
		"clientRuc",
		"total",
		"base",
		"igv",
	];

	if (error.code === "invalid_type" || error.code === "invalid_value") {
		return "CRITICAL";
	}

	if (error.path.some((p) => criticalPaths.includes(p.toString()))) {
		return "CRITICAL";
	}

	// Warnings for non-blocking issues
	if (error.code === "custom") {
		return "WARNING";
	}

	return "INFO";
}

/**
 * Calculate validation cost
 */
function calculateValidationCost(
	inputTokens: number,
	outputTokens: number,
): number {
	const INPUT_COST_PER_1K = 0.003; // Claude Sonnet pricing
	const OUTPUT_COST_PER_1K = 0.015;

	const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
	const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;

	return inputCost + outputCost;
}

/**
 * Auto-correct invoice based on AI suggestions
 *
 * IMPORTANT: Only applies high-confidence (>0.9) suggestions
 * User must confirm medium-confidence suggestions
 * @param invoice - Input for invoice.
 * @param validationResult - Input for validationResult.
 * @returns Result of applyAutoCorrections.
 * @example
 * ```ts
 * const result = applyAutoCorrections({} as Invoice, {} as ValidationResponse);
 * console.log(result);
 * ```
 */

export function applyAutoCorrections(
	invoice: Invoice,
	validationResult: ValidationResponse,
): {
	correctedInvoice: Invoice;
	appliedCorrections: string[];
	pendingCorrections: string[];
} {
	const correctedInvoice = { ...invoice };
	const appliedCorrections: string[] = [];
	const pendingCorrections: string[] = [];

	if (!validationResult.suggestions) {
		return { correctedInvoice, appliedCorrections, pendingCorrections };
	}

	for (const suggestion of validationResult.suggestions) {
		// Auto-apply high-confidence suggestions
		if (suggestion.confidence > 0.9) {
			// Parse field path (e.g., "igv" or "items.0.total")
			const fieldPath = suggestion.field.split(".");

			// Apply correction (simplified - in production, use a proper deep set utility)
			if (fieldPath.length === 1 && fieldPath[0]) {
				(correctedInvoice as Record<string, unknown>)[fieldPath[0]] =
					suggestion.suggestion;
				appliedCorrections.push(
					`${suggestion.field}: ${suggestion.suggestion}`,
				);
			}
		} else {
			// Queue for user confirmation
			pendingCorrections.push(
				`${suggestion.field}: ${suggestion.suggestion} (${(suggestion.confidence * 100).toFixed(0)}% confianza)`,
			);
		}
	}

	return { correctedInvoice, appliedCorrections, pendingCorrections };
}

/**
 * Batch validate multiple invoices
 * @param invoices - Input for invoices.
 * @returns Result of batchValidateInvoices.
 * @example
 * ```ts
 * const result = await batchValidateInvoices([]);
 * console.log(result);
 * ```
 */

export async function batchValidateInvoices(
	invoices: unknown[],
): Promise<ValidationResponse[]> {
	loggers.validation.info("Validating invoices in batch", {
		count: invoices.length,
	});

	// Validate in parallel (max 3 at a time for Claude to avoid rate limits)
	const BATCH_SIZE = 3;
	const results: ValidationResponse[] = [];

	for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
		const batch = invoices.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map((inv) => validateInvoiceWithAI(inv)),
		);
		results.push(...batchResults);

		// Small delay between batches
		if (i + BATCH_SIZE < invoices.length) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	const validCount = results.filter((r) => r.isValid).length;
	const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

	loggers.validation.info("Batch validation complete", {
		validCount,
		total: invoices.length,
		totalCost,
	});

	return results;
}

/**
 * Adapter implementing application validation port with explicit advisory/deterministic split.
 */
export class ValidationServiceAdapter implements IValidationService {
	async validateAdvisory(
		invoiceData: Partial<InvoiceData>,
	): Promise<AdvisoryValidationResult> {
		const result = await validateInvoiceWithAI(invoiceData);

		return {
			success: result.success,
			cost: result.cost,
			duration: result.duration,
			isValid: result.isValid,
			corrections: (result.suggestions ?? []).map((suggestion) => ({
				field: suggestion.field,
				originalValue: undefined,
				correctedValue: suggestion.suggestion,
				confidence:
					suggestion.confidence > 0.9
						? "high"
						: suggestion.confidence > 0.7
							? "medium"
							: "low",
				reason: "AI advisory suggestion",
			})),
		};
	}

	async validateDeterministic(
		invoiceData: Partial<InvoiceData>,
	): Promise<DeterministicValidationResult> {
		const quick = quickValidate(invoiceData);
		return {
			success: quick.isValid,
			validatorVersion: "deterministic-local-1.0.0",
			reasonCode: quick.isValid ? "VALIDATION_OK" : "VALIDATION_FAILED",
			message: quick.isValid
				? "Deterministic schema checks passed"
				: quick.errors.map((error) => error.message).join("; "),
		};
	}
}
