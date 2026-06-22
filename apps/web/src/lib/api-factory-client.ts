/**
 * @fileoverview CRUD factory that generates typed API clients for any resource
 * path under the Eden Treaty tree.
 *
 * @module api-factory.client
 */

import { api, getTenantContext } from "./api";
import { extractOkData, unwrap } from "./api-helpers";
import type { CrudApiOptions, CrudMessages, TreatyParamRoute, TreatyRoot, TreatyRouteGroup } from "./api-factory.types";

/**
 * Creates a typed CRUD client for a resource under the Eden Treaty tree.
 *
 * The `path` supports dotted segments for nesting — e.g. `"banking.accounts"`
 * resolves to `treatyClient.api.banking.accounts` at runtime.
 * When `options.noPrefix` is true, the `api.` prefix is skipped so `path`
 * resolves directly from the treaty root.
 *
 * @typeParam TCreate - Shape of the create payload (default: `Record<string, unknown>`)
 * @typeParam TUpdate - Shape of the update payload (default: `Record<string, unknown>`)
 * @param path - Dot-separated resource path (e.g. `"customers"`, `"banking.accounts"`)
 * @param options - Optional configuration
 * @param options.extract - When `true`, wraps every response through
 *   `extractOkData` with the matching error message; when `false`, returns the
 *   raw `unwrap()` result
 * @param options.messages - Custom fallback error messages per CRUD verb
 * @param options.noPrefix - When `true`, resolves `path` from the treaty root
 *   without prepending `api.`
 * @returns An object with `{ list, getById, create, update, delete }` methods
 *
 * @example
 * ```ts
 * // Returns raw unwrap() result (no extractOkData hop):
 * const accounts = createCrudApi("banking.accounts")
 * const list = await accounts.list<Account[]>({ companyId })
 * const one  = await accounts.getById<Account>("id")
 *
 * // With extractOkData wrapping:
 * const customers = createCrudApi("customers", {
 *   extract: true,
 *   messages: {
 *     list: "No se pudieron cargar los clientes",
 *   },
 * })
 * ```
 */
export function createCrudApi<TCreate = Record<string, unknown>, TUpdate = Record<string, unknown>>(
	path: string,
	options?: CrudApiOptions,
) {
	const { extract = false, messages = {}, noPrefix = false } = options ?? {};
	const m: CrudMessages = {
		list: messages.list ?? `No se pudieron cargar ${path}`,
		getById: messages.getById ?? `No se pudo cargar ${path}`,
		create: messages.create ?? `No se pudo crear ${path}`,
		update: messages.update ?? `No se pudo actualizar ${path}`,
		delete: messages.delete ?? `No se pudo eliminar ${path}`,
	};

	function resolveGroup(): TreatyRouteGroup {
		const root: TreatyRoot = noPrefix
			? (api as TreatyRoot)
			: ((api as TreatyRoot).api as TreatyRoot);
		const segs = path.split(".");
		let cur: TreatyRoot = root;
		for (const seg of segs) {
			cur = cur[seg] as TreatyRoot;
		}
		return cur as unknown as TreatyRouteGroup;
	}

	function resolveParam(id: string): TreatyParamRoute {
		const root: TreatyRoot = noPrefix
			? (api as TreatyRoot)
			: ((api as TreatyRoot).api as TreatyRoot);
		const segs = path.split(".");
		let cur: TreatyRoot = root;
		for (let i = 0; i < segs.length - 1; i++) {
			cur = cur[segs[i]] as TreatyRoot;
		}
		const last = segs[segs.length - 1];
		return (cur[last] as (id: string) => TreatyParamRoute)(id);
	}

	const asEnvelope = <T>(p: Promise<T>) => p as Promise<Record<string, unknown>>;

	return {
		/** Fetch all records for the resource. Supports optional query filters. */
		list: async <T = unknown>(query?: Record<string, unknown>) => {
			const body = await unwrap(
				asEnvelope(resolveGroup().get({ query: { ...getTenantContext(), ...query } })),
			);
			return (extract ? extractOkData(body, m.list!) : body) as T[];
		},

		/** Fetch a single record by ID. Supports optional query params. */
		getById: async <T = unknown>(id: string, query?: Record<string, unknown>) => {
			const body = await unwrap(
				asEnvelope(resolveParam(id).get({ query: { ...getTenantContext(), ...query } })),
			);
			return (extract ? extractOkData(body, m.getById!) : body) as T;
		},

		/** Create a new record. Tenant context is auto-injected into the payload. */
		create: async (payload: TCreate) => {
			const body = await unwrap(
				asEnvelope(resolveGroup().post({
					...getTenantContext(),
					...(payload as Record<string, unknown>),
				})),
			);
			return (extract ? extractOkData(body, m.create!) : body) as TCreate;
		},

		/** Update an existing record by ID with a partial payload. */
		update: async <T = unknown>(id: string, payload: TUpdate) => {
			const body = await unwrap(
				asEnvelope(resolveParam(id).patch(payload as Record<string, unknown>)),
			);
			return (extract ? extractOkData(body, m.update!) : body) as T;
		},

		/** Delete a record by ID. */
		delete: async <T = unknown>(id: string) => {
			const body = await unwrap(
				asEnvelope(resolveParam(id).delete({ query: getTenantContext() })),
			);
			return (extract ? extractOkData(body, m.delete!) : body) as T;
		},
	};
}
