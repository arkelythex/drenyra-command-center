/**
 * Standardized Error Codes for the Drenyra API.
 *
 * Every API error response includes a `code` from this enum so that
 * frontend consumers can switch on the code programmatically (e.g. for
 * i18n, retry logic, or conditional UI).
 *
 * @module shared/error-codes
 */

export const ErrorCodes = {
	NOT_FOUND: "NOT_FOUND",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	CONFLICT: "CONFLICT",
	RATE_LIMITED: "RATE_LIMITED",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	DEPENDENCY_FAILURE: "DEPENDENCY_FAILURE",
	BAD_REQUEST: "BAD_REQUEST",
	UNPROCESSABLE: "UNPROCESSABLE",
	TIMEOUT: "TIMEOUT",
} as const;

/** Literal union type derived from ErrorCodes. */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
