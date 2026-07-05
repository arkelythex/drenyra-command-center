/**
 * @fileoverview Barrel module for the API factory layer.
 *
 * Re-exports all public symbols from the three sub-modules:
 * - {@link api-factory.types} — shared type definitions
 * - {@link api-factory.interceptors} — API call wrappers with tenant context injection
 * - {@link api-factory.client} — CRUD factory for typed resource clients
 *
 * @module api-factory
 */

// ── Re-export types ───────────────────────────────────────────────────────────
export {
	ApiError,
	type ApiResult,
	type CrudApiOptions,
	type CrudMessages,
	type TenantContext,
} from "./api-factory.types";
// ── Re-export CRUD factory ────────────────────────────────────────────────────
export { createCrudApi } from "./api-factory-client";
// ── Re-export interceptors ────────────────────────────────────────────────────
export {
	mutateApi,
	queryApi,
	queryApiPassthrough,
	safeApiCall,
} from "./api-factory-interceptors";

import { createCrudApi } from "./api-factory-client";
// ── Convenience object ────────────────────────────────────────────────────────
import {
	mutateApi,
	queryApi,
	queryApiPassthrough,
	safeApiCall,
} from "./api-factory-interceptors";

/**
 * Convenience object grouping all API factory utilities.
 *
 * @example
 * ```ts
 * import { apiFactory } from "@/lib/api-factory"
 *
 * const result = await apiFactory.safeCall(() => someApiCall())
 * const data   = await apiFactory.query(ctx => api.resource.get(...), "msg")
 * const crud   = apiFactory.crud("customers", { extract: true })
 * ```
 */
export const apiFactory = {
	safeCall: safeApiCall,
	query: queryApi,
	queryPassthrough: queryApiPassthrough,
	mutate: mutateApi,
	crud: createCrudApi,
};
