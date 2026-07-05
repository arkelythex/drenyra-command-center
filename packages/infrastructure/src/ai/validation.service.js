import { generateObject } from "ai";
import { z } from "zod";
import { loggers } from "../logger";
import { getValidationPrompt } from "./prompts";
import { aiRouter } from "./router";
import { validateInvoice } from "./schemas/invoice";

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
export async function validateInvoiceWithAI(invoice) {
	const startTime = Date.now();
	try {
		const zodResult = validateInvoice(invoice);
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
						severity: "CRITICAL",
					})),
					duration: Date.now() - startTime,
				};
			}
		}
		const { model, recordMetrics } = await aiRouter.route("VALIDATION");
		const result = await generateObject({
			model,
			schema: AIValidationResultSchema,
			prompt: getValidationPrompt(invoice),
			temperature: 0.2,
			maxRetries: 2,
		});
		const duration = Date.now() - startTime;
		const inputTokens = result.usage?.totalTokens || 0;
		const outputTokens = result.usage?.totalTokens || 0;
		const cost = calculateValidationCost(inputTokens, outputTokens);
		recordMetrics(inputTokens, outputTokens, true);
		const aiResult = result.object;
		return {
			success: true,
			isValid: aiResult.isValid,
			errors: aiResult.errors,
			suggestions: aiResult.suggestions,
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
export function quickValidate(invoice) {
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
function determineSeverity(error) {
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
	if (error.code === "custom") {
		return "WARNING";
	}
	return "INFO";
}
function calculateValidationCost(inputTokens, outputTokens) {
	const INPUT_COST_PER_1K = 0.003;
	const OUTPUT_COST_PER_1K = 0.015;
	const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
	const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;
	return inputCost + outputCost;
}
export function applyAutoCorrections(invoice, validationResult) {
	const correctedInvoice = { ...invoice };
	const appliedCorrections = [];
	const pendingCorrections = [];
	if (!validationResult.suggestions) {
		return { correctedInvoice, appliedCorrections, pendingCorrections };
	}
	for (const suggestion of validationResult.suggestions) {
		if (suggestion.confidence > 0.9) {
			const fieldPath = suggestion.field.split(".");
			if (fieldPath.length === 1 && fieldPath[0]) {
				correctedInvoice[fieldPath[0]] = suggestion.suggestion;
				appliedCorrections.push(
					`${suggestion.field}: ${suggestion.suggestion}`,
				);
			}
		} else {
			pendingCorrections.push(
				`${suggestion.field}: ${suggestion.suggestion} (${(suggestion.confidence * 100).toFixed(0)}% confianza)`,
			);
		}
	}
	return { correctedInvoice, appliedCorrections, pendingCorrections };
}
export async function batchValidateInvoices(invoices) {
	loggers.validation.info("Validating invoices in batch", {
		count: invoices.length,
	});
	const BATCH_SIZE = 3;
	const results = [];
	for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
		const batch = invoices.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map((inv) => validateInvoiceWithAI(inv)),
		);
		results.push(...batchResults);
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
export class ValidationServiceAdapter {
	async validateAdvisory(invoiceData) {
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
	async validateDeterministic(invoiceData) {
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
//# sourceMappingURL=validation.service.js.map
