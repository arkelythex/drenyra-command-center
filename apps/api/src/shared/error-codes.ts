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

// --- Thread System ---

export const ThreadErrorCodes = {
	THREAD_NOT_FOUND: "THREAD_NOT_FOUND",
	THREAD_INVALID_TRANSITION: "THREAD_INVALID_TRANSITION",
	THREAD_NO_TASKS: "THREAD_NO_TASKS",
	THREAD_TASKS_INCOMPLETE: "THREAD_TASKS_INCOMPLETE",
	THREAD_ALREADY_CLOSED: "THREAD_ALREADY_CLOSED",
	THREAD_EVIDENCE_ALREADY_LINKED: "THREAD_EVIDENCE_ALREADY_LINKED",
	THREAD_COMPANY_MISMATCH: "THREAD_COMPANY_MISMATCH",
	THREAD_INVALID_PERIOD: "THREAD_INVALID_PERIOD",
} as const;

export type ThreadErrorCode =
	(typeof ThreadErrorCodes)[keyof typeof ThreadErrorCodes];
