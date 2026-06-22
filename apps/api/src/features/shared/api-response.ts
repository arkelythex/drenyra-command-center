import type { RunbookReference } from '../../lib/compliance-runbooks';

/**
 * ApiSuccess interface.
 *
 * @example
 * ```ts
 * const value: ApiSuccess = {} as ApiSuccess;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for ApiSuccess.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * ApiFailure interface.
 *
 * @example
 * ```ts
 * const value: ApiFailure = {} as ApiFailure;
 * console.log(value);
 * ```
 */
export interface ApiFailure {
  success: false;
  error: string;
  code?: string;
  runbook?: RunbookReference;
  field?: string;
  details?: unknown;
}

/**
 * ok operation.
 *
 * @param data - Input for data.
 * @returns Result of ok.
 * @example
 * ```ts
 * const result = ok({} as T);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for ok.
 */

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

/**
 * fail operation.
 *
 * @param error - Input for error.
 * @param code - Input for code.
 * @param options - Input for options.
 * @returns Result of fail.
 * @example
 * ```ts
 * const result = fail("", "", {});
 * console.log(result);
 * ```
 */
export function fail(
  error: string,
  code?: string,
  options?: { runbook?: RunbookReference; field?: string; details?: unknown }
): ApiFailure {
  return {
    success: false,
    error,
    code,
    ...(options?.runbook ? { runbook: options.runbook } : {}),
    ...(options?.field ? { field: options.field } : {}),
    ...(typeof options?.details !== 'undefined' ? { details: options.details } : {}),
  };
}

/**
 * getErrorMessage operation.
 *
 * @param error - Input for error.
 * @param fallback - Input for fallback.
 * @returns Result of getErrorMessage.
 * @example
 * ```ts
 * const result = getErrorMessage(undefined, undefined);
 * console.log(result);
 * ```
 */
export function getErrorMessage(error: unknown, fallback = 'Internal server error'): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
