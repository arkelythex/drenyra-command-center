import type { InvoiceData } from "./IOcrService";

/**
 * A single correction proposal produced by the validation layer (often AI-assisted).
 *
 * @example
 * ```ts
 * const correction: ValidationCorrection = {
 *   field: "totalAmount",
 *   originalValue: 118,
 *   correctedValue: 118.0,
 *   confidence: "high",
 *   reason: "Total matches sum of items + IGV",
 * };
 * ```
 */
export interface ValidationCorrection {
	field: string;
	originalValue: unknown;
	correctedValue: unknown;
	confidence: "high" | "medium" | "low";
	reason: string;
}

/**
 * Result returned by an AI validation flow.
 *
 * @example
 * ```ts
 * const result: AIValidationResult = {
 *   success: true,
 *   isValid: true,
 *   corrections: [],
 * };
 * ```
 */
export interface AIValidationResult {
	success: boolean;
	cost?: number;
	duration?: number;
	isValid: boolean;
	corrections: ValidationCorrection[];
}

/**
 * Deterministic validation result used for authoritative fiscal checks.
 */
export interface DeterministicValidationResult {
	success: boolean;
	validatorVersion: string;
	reasonCode: string;
	message: string;
}

/**
 * Advisory validation result produced by AI assistance.
 */
export type AdvisoryValidationResult = AIValidationResult;

/**
 * Validation service port (application layer) for checking extracted invoice data.
 *
 * @example
 * ```ts
 * const validator: IValidationService = getValidationService();
 * const result = await validator.validate({ series: "F001", number: 1234 });
 * ```
 */
export interface IValidationService {
	validateAdvisory(
		invoiceData: Partial<InvoiceData>,
	): Promise<AdvisoryValidationResult>;
	validateDeterministic(
		invoiceData: Partial<InvoiceData>,
	): Promise<DeterministicValidationResult>;
}
