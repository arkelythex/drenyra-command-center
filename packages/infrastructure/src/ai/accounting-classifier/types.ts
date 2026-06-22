/**
 * Accounting Classifier Types
 *
 * Types and schemas for LLM-based accounting classification (PCGE Peru)
 */

import { z } from "zod";

/**
 * Classification input
 * @example
 * ```ts
 * const value: ClassificationInput = {} as ClassificationInput;
 * console.log(value);
 * ```
 */

export interface ClassificationInput {
	itemDescription: string;
	amount: number;
	businessType?: string;
	providerName?: string;
	category?: string;
}

/**
 * Classification result
 * @example
 * ```ts
 * const value: ClassificationResult = {} as ClassificationResult;
 * console.log(value);
 * ```
 */

export interface ClassificationResult {
	accountCode: string;
	accountName: string;
	category: "EXPENSE" | "ASSET" | "COST_OF_GOODS_SOLD" | "OTHER";
	confidence: number;
	reasoning: string;
	suggestedDebitAccount?: string;
	suggestedCreditAccount?: string;
}

/**
 * Schema for structured output
 */
export const ClassificationSchema = z.object({
	accountCode: z.string().describe("Código de cuenta PCGE (ej: 6011, 6311)"),
	accountName: z.string().describe("Nombre de la cuenta contable"),
	category: z.enum(["EXPENSE", "ASSET", "COST_OF_GOODS_SOLD", "OTHER"]),
	confidence: z.number().min(0).max(1).describe("Nivel de confianza 0-1"),
	reasoning: z.string().describe("Breve explicación de la clasificación"),
	suggestedDebitAccount: z
		.string()
		.optional()
		.describe("Cuenta de cargo sugerida"),
	suggestedCreditAccount: z
		.string()
		.optional()
		.describe("Cuenta de abono sugerida"),
});
