/**
 * @fileoverview API interceptors: functions that wrap Eden Treaty calls with
 * tenant-context injection and response normalisation.
 *
 * Every function auto-injects tenant context (companyId, fiscal period)
 * so call sites never pass it manually.
 *
 * @module api-factory.interceptors
 */

import { getTenantContext, type TenantContext } from "./api";
import { ApiError, extractOkData, extractOkDataOrPassthrough, unwrap } from "./api-helpers";
import type { ApiResult } from "./api-factory.types";

export type { TenantContext };

export { ApiError };

/**
 * Wraps any API call in a try/catch and normalises to a discriminated union.
 *
 * Use when you want to avoid exception propagation — call sites
 * match on `result.ok` instead of try/catch.
 *
 * @typeParam T - The success data type
 * @param call - Thunk returning the API promise; not executed until called
 * @returns `{ ok: true, data: T }` or `{ ok: false, error, code? }`
 *
 * @example
 * ```ts
 * const result = await safeApiCall(() =>
 *   unwrap(api.api.customers.get({ query: { companyId } }))
 * )
 * if (!result.ok) return toast.error(result.error)
 * // result.data is typed T
 * ```
 *
 * @see {@link ApiError} for the error class matched inside
 */
export async function safeApiCall<T>(
	call: () => Promise<T>,
): Promise<ApiResult<T>> {
	try {
		const data = await call();
		return { ok: true, data };
	} catch (e) {
		if (e instanceof ApiError) {
			return { ok: false, error: e.message, code: e.code };
		}
		if (e instanceof Error) {
			return { ok: false, error: e.message };
		}
		return { ok: false, error: "Error desconocido" };
	}
}

/**
 * Eden Treaty GET with automatic tenant context injection,
 * then unwrap + extractOkData.
 *
 * Injects `companyId` and related context via {@link getTenantContext},
 * so callers do not pass it explicitly.
 *
 * @typeParam T - The expected response data type
 * @param call - Callback that receives the tenant context and invokes the GET
 * @param fallbackMessage - Human-readable error string if the server response
 *   cannot be extracted
 * @returns The unwrapped and extracted data (typed T)
 * @throws If the Eden response is an error envelope, throws an `ApiError`
 *
 * @example
 * ```ts
 * const accounts = await queryApi(
 *   (ctx) => api.api.banking.accounts.get({ query: ctx }),
 *   "No se pudieron cargar las cuentas",
 * )
 * ```
 *
 * @see {@link mutateApi} for write operations
 * @see {@link queryApiPassthrough} for routes without the ok() envelope
 */
export async function queryApi<T>(
	call: (ctx: TenantContext) => Promise<unknown>,
	fallbackMessage: string,
): Promise<T> {
	const body = await unwrap(call(getTenantContext()) as Promise<Record<string, unknown>>);
	return extractOkData(body, fallbackMessage) as T;
}

/**
 * Like {@link queryApi} but uses `extractOkDataOrPassthrough` for routes
 * that return unwrapped bodies (no `ok()` envelope).
 *
 * Use when the server response is not wrapped in `{ ok: true, data: ... }` —
 * the raw response is returned directly.
 *
 * @typeParam T - The expected response data type
 * @param call - Callback that receives the tenant context and invokes the GET
 * @param fallbackMessage - Human-readable error string on failure
 * @returns The response body — either extracted from an ok() envelope or passed through
 * @throws If the Eden response is an error envelope
 *
 * @example
 * ```ts
 * const config = await queryApiPassthrough(
 *   (ctx) => api.api.settings.get({ query: ctx }),
 *   "No se pudo cargar la configuración",
 * )
 * ```
 */
export async function queryApiPassthrough<T>(
	call: (ctx: TenantContext) => Promise<unknown>,
	fallbackMessage: string,
): Promise<T> {
	const body = await unwrap(call(getTenantContext()) as Promise<Record<string, unknown>>);
	return extractOkDataOrPassthrough(body, fallbackMessage) as T;
}

/**
 * Eden Treaty POST/PUT/PATCH/DELETE with tenant context auto-injected
 * into the body, then unwrap + extractOkData.
 *
 * @typeParam T - The expected response data type
 * @param call - Callback that receives the tenant context and invokes the mutation
 * @param fallbackMessage - Human-readable error string on failure
 * @returns The unwrapped and extracted response data (typed T)
 * @throws If the Eden response is an error envelope
 *
 * @example
 * ```ts
 * const newAccount = await mutateApi(
 *   (ctx) => api.api.banking.accounts.post({ ...ctx, name: "Caja Chica" }),
 *   "No se pudo crear la cuenta",
 * )
 * ```
 *
 * @see {@link queryApi} for read operations
 */
export async function mutateApi<T>(
	call: (ctx: TenantContext) => Promise<unknown>,
	fallbackMessage: string,
): Promise<T> {
	const body = await unwrap(call(getTenantContext()) as Promise<Record<string, unknown>>);
	return extractOkData(body, fallbackMessage) as T;
}
