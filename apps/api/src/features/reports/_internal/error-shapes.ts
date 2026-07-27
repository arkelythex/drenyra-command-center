/**
 * Error Response Helpers
 *
 * Consistent error shapes for all reports API endpoints.
 * Returns { success: false, error: string, code: string, message: string, details?: unknown }
 */

import { fail } from "../../shared/api-response";

/**
 * Create a standardized reports API error response.
 */
export function reportError(
	code: string,
	message: string,
	details?: unknown,
	status?: number,
): ReturnType<typeof fail> {
	return fail(message, code, { details, status });
}

/**
 * Common error codes for reports module.
 */
export const ErrorCodes = {
	VALIDATION_ERROR: "VALIDATION_ERROR",
	REPORT_CONTRACT_ERROR: "REPORT_CONTRACT_ERROR",
	LEDGER_UNAVAILABLE: "LEDGER_UNAVAILABLE",
	PLE_DISABLED: "PLE_DISABLED",
	PLE_VALIDATION_FAILED: "PLE_VALIDATION_FAILED",
	PLE_NOT_FOUND: "PLE_NOT_FOUND",
	CONSOLIDATION_NOT_READY: "CONSOLIDATION_NOT_READY",
	COMPANY_CONTEXT_REQUIRED: "COMPANY_CONTEXT_REQUIRED",
	INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
