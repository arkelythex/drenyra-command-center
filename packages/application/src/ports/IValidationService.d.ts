import type { InvoiceData } from "./IOcrService";
export interface ValidationCorrection {
	field: string;
	originalValue: unknown;
	correctedValue: unknown;
	confidence: "high" | "medium" | "low";
	reason: string;
}
export interface AIValidationResult {
	success: boolean;
	cost?: number;
	duration?: number;
	isValid: boolean;
	corrections: ValidationCorrection[];
}
export interface DeterministicValidationResult {
	success: boolean;
	validatorVersion: string;
	reasonCode: string;
	message: string;
}
export type AdvisoryValidationResult = AIValidationResult;
export interface IValidationService {
	validateAdvisory(
		invoiceData: Partial<InvoiceData>,
	): Promise<AdvisoryValidationResult>;
	validateDeterministic(
		invoiceData: Partial<InvoiceData>,
	): Promise<DeterministicValidationResult>;
}
//# sourceMappingURL=IValidationService.d.ts.map
