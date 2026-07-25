const DEFAULT_OPTIONS = {
	maxDecimals: 2,
	maxValue: 999_999_999_999.99,
	minValue: -999_999_999_999.99,
	currency: "PEN",
	allowNegative: true,
};
export function sanitizeInvoiceNumber(number) {
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
export function sanitizeMonetaryValue(value, options = {}) {
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
