/**
 * @fileoverview Shared types for the API factory layer.
 *
 * @module api-factory.types
 */

import type { TenantContext } from "./api";
import { ApiError } from "./api-helpers";

export type { TenantContext };

export { ApiError };

/**
 * Discriminated union returned by {@link safeApiCall}.
 *
 * - `{ ok: true, data: T }` on success
 * - `{ ok: false, error: string, code?: string }` on failure
 *
 * @typeParam T - The data type on success
 */
export type ApiResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: string; code?: string };

/**
 * Human-readable fallback messages for CRUD operations.
 * Each field overrides the auto-generated default for that operation.
 */
export type CrudMessages = {
	/** Error message shown when the list fetch fails */
	list?: string;
	/** Error message shown when fetching by ID fails */
	getById?: string;
	/** Error message shown when creation fails */
	create?: string;
	/** Error message shown when update fails */
	update?: string;
	/** Error message shown when deletion fails */
	delete?: string;
};

/**
 * Configuration options for the {@link createCrudApi} factory.
 *
 * @property extract - When `true`, wraps responses through `extractOkData`
 *   with the operation's error message
 * @property messages - Custom fallback error messages per CRUD verb, overrides
 *   the auto-generated defaults
 * @property noPrefix - When `true`, resolves `path` from the treaty root
 *   without prepending `api.` (for routes mounted at the top level)
 */
export interface CrudApiOptions {
	/** When true, wraps every response through extractOkData */
	extract?: boolean;
	/** Custom fallback error messages per CRUD verb */
	messages?: CrudMessages;
	/** When true, resolves path from the treaty root without `api.` prefix */
	noPrefix?: boolean;
}

/** @internal */
export type TreatyRouteGroup = {
	get: (opts?: unknown) => Promise<unknown>;
	post: (opts?: unknown) => Promise<unknown>;
};

/** @internal */
export type TreatyParamRoute = {
	get: (opts?: unknown) => Promise<unknown>;
	patch: (opts?: unknown) => Promise<unknown>;
	delete: (opts?: unknown) => Promise<unknown>;
};

/** @internal */
export type TreatyRoot = Record<string, unknown>;
