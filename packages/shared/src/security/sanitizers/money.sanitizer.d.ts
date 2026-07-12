export interface MoneySanitizerOptions {
	maxDecimals?: number;
	maxValue?: number;
	minValue?: number;
	currency?: string;
	allowNegative?: boolean;
}
export interface MoneySanitizeResult {
	value: string | null;
	isValid: boolean;
	numericValue: number | null;
	error?: string;
	wasRounded: boolean;
}
export declare function sanitizeInvoiceNumber(number: unknown): string;
export declare function sanitizeMonetaryValue(
	value: unknown,
	options?: MoneySanitizerOptions,
): MoneySanitizeResult;
//# sourceMappingURL=money.sanitizer.d.ts.map
