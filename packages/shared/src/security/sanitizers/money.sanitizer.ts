/**
 * Options for monetary input normalization and range validation.
 *
 * @example
 * ```ts
 * const options: MoneySanitizerOptions = { maxDecimals: 2, allowNegative: false };
 * ```
 */
export interface MoneySanitizerOptions {
	maxDecimals?: number;
	maxValue?: number;
	minValue?: number;
	currency?: string;
	allowNegative?: boolean;
}

/**
 * Result envelope from monetary sanitization.
 *
 * @example
 * ```ts
 * const result: MoneySanitizeResult = {
 *   value: "1500.50",
 *   isValid: true,
 *   numericValue: 1500.5,
 *   wasRounded: false,
 * };
 * ```
 */
export interface MoneySanitizeResult {
	value: string | null;
	isValid: boolean;
	numericValue: number | null;
	error?: string;
	wasRounded: boolean;
}

const DEFAULT_OPTIONS: Required<MoneySanitizerOptions> = {
	maxDecimals: 2,
	maxValue: 999_999_999_999.99,
	minValue: -999_999_999_999.99,
	currency: "PEN",
	allowNegative: true,
};

/**
 * Normalizes invoice identifiers for consistent matching/indexing.
 *
 * @param number - Candidate invoice identifier
 * @returns Uppercased identifier limited to alphanumeric + hyphen
 * @example
 * ```ts
 * const normalized = sanitizeInvoiceNumber("f001/123");
 * // "F001123"
 * ```
 */
export function sanitizeInvoiceNumber(number: unknown): string {
	if (typeof number !== "string") {
		return "";
	}

	if (!number.trim()) {
		return "";
	}

	return number
		.replace(/[^a-zA-Z0-9-]/g, "")
		.slice(0, 20)
		.toUpperCase();
}

/**
 * Sanitizes and validates a monetary value against configured limits.
 *
 * @param value - Candidate amount input
 * @param options - Validation/formatting options
 * @returns Parsed money payload with error details when invalid
 * @example
 * ```ts
 * const amount = sanitizeMonetaryValue("1250.40", { maxDecimals: 2 });
 * // { value: "1250.40", isValid: true, numericValue: 1250.4, ... }
 * ```
 */
export function sanitizeMonetaryValue(
	value: unknown,
	options: MoneySanitizerOptions = {},
): MoneySanitizeResult {
	const config = { ...DEFAULT_OPTIONS, ...options };

	if (value === null || value === undefined) {
		return {
			value: null,
			isValid: false,
			numericValue: null,
			error: "Value is required",
			wasRounded: false,
		};
	}

	const strValue = String(value).trim();

	if (!strValue) {
		return {
			value: null,
			isValid: false,
			numericValue: null,
			error: "Value cannot be empty",
			wasRounded: false,
		};
	}

	let cleaned = strValue.replace(/[^\d.-]/g, "").replace(/(?!^)-/g, "");

	const parts = cleaned.split(".");
	if (parts.length > 2) {
		cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
	}

	const numericPattern = /^-?\d+(\.\d+)?$/;
	if (!numericPattern.test(cleaned)) {
		return {
			value: null,
			isValid: false,
			numericValue: null,
			error: "Invalid numeric format",
			wasRounded: false,
		};
	}

	const num = parseFloat(cleaned);

	if (Number.isNaN(num)) {
		return {
			value: null,
			isValid: false,
			numericValue: null,
			error: "Invalid numeric value (NaN)",
			wasRounded: false,
		};
	}

	if (num < config.minValue) {
		return {
			value: null,
			isValid: false,
			numericValue: null,
			error: `Value below minimum (${config.minValue})`,
			wasRounded: false,
		};
	}

	if (num > config.maxValue) {
		return {
			value: null,
			isValid: false,
			numericValue: null,
			error: `Value above maximum (${config.maxValue})`,
			wasRounded: false,
		};
	}

	const formatted = num.toFixed(config.maxDecimals);

	return {
		value: formatted,
		isValid: true,
		numericValue: num,
		wasRounded: false,
	};
}
