import type {
	AdvisoryValidationResult,
	DeterministicValidationResult,
	InvoiceData,
	IValidationService,
} from "@drenyra/application";
import { type Invoice } from "./schemas/invoice";
export type ErrorSeverity = "CRITICAL" | "WARNING" | "INFO";
export interface ValidationError {
	field: string;
	message: string;
	severity: ErrorSeverity;
	currentValue?: unknown;
	expectedValue?: unknown;
	suggestion?: string;
}
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
export declare function validateInvoiceWithAI(
	invoice: unknown,
): Promise<ValidationResponse>;
export declare function quickValidate(invoice: unknown): {
	isValid: boolean;
	errors: ValidationError[];
};
export declare function applyAutoCorrections(
	invoice: Invoice,
	validationResult: ValidationResponse,
): {
	correctedInvoice: Invoice;
	appliedCorrections: string[];
	pendingCorrections: string[];
};
export declare function batchValidateInvoices(
	invoices: unknown[],
): Promise<ValidationResponse[]>;
export declare class ValidationServiceAdapter implements IValidationService {
	validateAdvisory(
		invoiceData: Partial<InvoiceData>,
	): Promise<AdvisoryValidationResult>;
	validateDeterministic(
		invoiceData: Partial<InvoiceData>,
	): Promise<DeterministicValidationResult>;
}
//# sourceMappingURL=validation.service.d.ts.map
