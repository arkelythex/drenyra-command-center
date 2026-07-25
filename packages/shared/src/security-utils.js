export function sanitizeSqlInput(input, maxLength = 100) {
	if (!input || typeof input !== "string") {
		return "";
	}
	const escaped = input
		.replace(/\\/g, "\\\\")
		.replace(/%/g, "\\%")
		.replace(/_/g, "\\_")
		.replace(/'/g, "''")
		.replace(/\[/g, "\\[")
		.replace(/\]/g, "\\]")
		.replace(/\^/g, "\\^");
	return escaped.slice(0, maxLength).trim();
}
export function sanitizeUuid(uuid) {
	if (!uuid || typeof uuid !== "string") {
		return null;
	}
	const uuidPattern =
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	const trimmed = uuid.trim().toLowerCase();
	if (!uuidPattern.test(trimmed)) {
		return null;
	}
	return trimmed;
}
export function sanitizeMonetaryValue(value, maxDecimals = 2) {
	if (value === null || value === undefined) {
		return null;
	}
	const strValue = String(value).trim();
	const cleaned = strValue.replace(/[^0-9.-]/g, "");
	const numericPattern = /^-?\d+(\.\d+)?$/;
	if (!numericPattern.test(cleaned)) {
		return null;
	}
	const num = parseFloat(cleaned);
	if (num < -999999999999.99 || num > 999999999999.99) {
		return null;
	}
	return num.toFixed(maxDecimals);
}
export function sanitizeInvoiceNumber(number) {
	if (!number || typeof number !== "string") {
		return "";
	}
	return number
		.replace(/[^a-zA-Z0-9-]/g, "")
		.slice(0, 20)
		.toUpperCase();
}
export function createSafeLikePattern(searchTerm) {
	const sanitized = sanitizeSqlInput(searchTerm, 50);
	if (!sanitized) {
		return { pattern: "", isValid: false };
	}
	return {
		pattern: `%${sanitized}%`,
		isValid: true,
	};
}
export function sanitizeDateRange(startDate, endDate) {
	const start = startDate instanceof Date ? startDate : new Date(startDate);
	const end = endDate instanceof Date ? endDate : new Date(endDate);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return {
			isValid: false,
			start: null,
			end: null,
			error: "Invalid date format",
		};
	}
	const maxFuture = new Date();
	maxFuture.setFullYear(maxFuture.getFullYear() + 1);
	if (start > maxFuture || end > maxFuture) {
		return {
			isValid: false,
			start: null,
			end: null,
			error: "Date too far in future",
		};
	}
	if (start > end) {
		return {
			isValid: false,
			start: null,
			end: null,
			error: "Start date must be before end date",
		};
	}
	const oneYear = 365 * 24 * 60 * 60 * 1000;
	if (end.getTime() - start.getTime() > oneYear) {
		return {
			isValid: false,
			start: null,
			end: null,
			error: "Date range cannot exceed 1 year",
		};
	}
	return { isValid: true, start, end };
}
export const SECURITY_CONSTANTS = {
	MAX_SEARCH_LENGTH: 100,
	MAX_INVOICE_NUMBER_LENGTH: 20,
	MAX_QUERY_LIMIT: 1000,
	DEFAULT_QUERY_LIMIT: 50,
	MAX_DATE_RANGE_DAYS: 365,
	ALLOWED_SORT_FIELDS: ["createdAt", "updatedAt", "totalAmount", "issueDate"],
	ALLOWED_SORT_ORDERS: ["asc", "desc"],
};
export function sanitizePagination(limit, offset) {
	const parsedLimit = Math.min(
		Math.max(
			parseInt(String(limit), 10) || SECURITY_CONSTANTS.DEFAULT_QUERY_LIMIT,
			1,
		),
		SECURITY_CONSTANTS.MAX_QUERY_LIMIT,
	);
	const parsedOffset = Math.max(parseInt(String(offset), 10) || 0, 0);
	return {
		limit: parsedLimit,
		offset: parsedOffset,
		isValid: true,
	};
}
