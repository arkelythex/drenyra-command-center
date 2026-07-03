/**
 * Unified API Response Envelope.
 *
 * Every endpoint response follows this contract so that frontend consumers
 * always know the shape of the response without adivinanzas.
 *
 * ## Success
 * ```ts
 * { success: true, data: T, meta?: { total, limit, offset, cursor } }
 * ```
 *
 * ## Error
 * ```ts
 * {
 *   success: false,
 *   error: { code: "NOT_FOUND", message: "…", details?: unknown, requestId?: string }
 * }
 * ```
 *
 * @module shared/api-response
 */

import type { ErrorCode } from "./error-codes";

// ─── Response Types ────────────────────────────────────────────────

/** Pagination / cursor metadata, included when the response is a list. */
export interface ResponseMeta {
	total?: number;
	limit?: number;
	offset?: number;
	cursor?: string;
}

/** Shape of a successful response body. */
export interface SuccessResponse<T> {
	success: true;
	data: T;
	meta?: ResponseMeta;
}

/** Shape of an error response body. */
export interface ErrorDetail {
	code: ErrorCode;
	message: string;
	details?: unknown;
	requestId?: string;
}

/** Shape of a failed response body. */
export interface FailureResponse {
	success: false;
	error: ErrorDetail;
}

/** Union of all possible response shapes. */
export type ApiResponse<T> = SuccessResponse<T> | FailureResponse;

// ─── Response Builders ─────────────────────────────────────────────

/**
 * Build a success response.
 *
 * @example
 * ```ts
 * return ok(prs)                                   // { success: true, data: prs }
 * return ok(prs, { total: 42, limit: 10, offset: 0 }) // with pagination meta
 * ```
 */
export function ok<T>(data: T, meta?: ResponseMeta): SuccessResponse<T> {
	return meta ? { success: true, data, meta } : { success: true, data };
}

/**
 * Build an error response.
 *
 * @example
 * ```ts
 * return fail('NOT_FOUND', 'PR no encontrado')
 * return fail('VALIDATION_ERROR', 'Campo inválido', { field: 'amount' })
 * ```
 */
export function fail(
	code: ErrorCode,
	message: string,
	details?: unknown,
	requestId?: string,
): FailureResponse {
	const error: ErrorDetail = { code, message };
	if (details !== undefined) error.details = details;
	if (requestId) error.requestId = requestId;
	return { success: false, error };
}

/**
 * Safely extract an error message from an unknown error value.
 *
 * @example
 * ```ts
 * const msg = getErrorMessage(err, 'Error al procesar PR')
 * ```
 */
export function getErrorMessage(
	error: unknown,
	fallback = "Internal server error",
): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
}
