import { getErrorMessage } from "../../shared/api-response";

interface MappedError {
	status: number;
	body: { success: false; error: string; code: string };
}

const ERROR_PATTERNS: Array<{
	pattern: RegExp;
	status: number;
	code: string;
}> = [
	// Validation errors — 400
	{ pattern: /RUC checksum/, status: 400, code: "INVALID_RUC" },
	{ pattern: /RUC must be exactly 11 digits/, status: 400, code: "INVALID_RUC" },
	{ pattern: /Organization name is required/, status: 400, code: "INVALID_NAME" },
	{ pattern: /Slug must be in kebab-case/, status: 400, code: "INVALID_SLUG" },
	// Duplicate errors — 409
	{
		pattern: /RUC already exists/,
		status: 409,
		code: "RUC_ALREADY_EXISTS",
	},
	{
		pattern: /slug already exists/,
		status: 409,
		code: "SLUG_ALREADY_EXISTS",
	},
	// Status transition errors — 409
	{
		pattern: /Cannot transition from/,
		status: 409,
		code: "INVALID_TRANSITION",
	},
	// Not found — 404
	{
		pattern: /Organization not found/,
		status: 404,
		code: "CLIENT_NOT_FOUND",
	},
	// Tenant scope violation — 403
	{
		pattern: /tenant scope/,
		status: 403,
		code: "TENANT_SCOPE_VIOLATION",
	},
];

export function mapUseCaseError(error: unknown): MappedError {
	const message = getErrorMessage(error, "Internal server error");

	for (const { pattern, status, code } of ERROR_PATTERNS) {
		if (pattern.test(message)) {
			return {
				status,
				body: { success: false, error: message, code },
			};
		}
	}

	return {
		status: 500,
		body: { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
	};
}
