/**
 * @fileoverview Eden Treaty route client registry.
 *
 * Provides a central registry for lazily-loaded Eden Treaty route clients and
 * helpers for extracting human-readable error messages from treaty responses.
 *
 * **Design philosophy:**
 * - Clients are registered once and reused — avoids re-traversing the treaty tree
 * - `getTreatyRouteClient` resolves a route from the treaty root (with or without
 *   the `api.` prefix) and auto-registers it
 * - Error messages are extracted from nested error shapes that Eden returns,
 *   with a cascading fallback: `string` → `Error.message` → `response.message`
 *   → `response.error` → generic fallback
 *
 * **Error handling:**
 * - `getTreatyRouteClient` throws if the route key is not found on the treaty tree
 * - `getTreatyErrorMessage` never throws — it always returns a string
 *
 * @see {@link getTreatyRouteClient} for lazy route resolution
 * @see {@link getTreatyErrorMessage} for safe error extraction
 */

import { api } from "@/lib/api";

/**
 * Minimal type for an Eden Treaty route client.
 *
 * Covers the chainable patterns used throughout the codebase:
 * - `client.get(opts)` / `client.post(opts)` for collection routes
 * - `client({ id }).get()` / `.patch()` / `.delete()` for param routes
 * - `client({ id }).nested.action(opts)` for sub-routes
 *
 * This is intentionally loose — Eden Treaty uses deeply recursive conditional
 * types that are impractical to replicate. The real type safety comes from
 * the typed API wrappers (creditNotesApi, debitNotesApi, etc.) that consume
 * these clients.
 */
export type TreatyClientRoute = {
	// Callable for parameterized routes: client({ id })
	(params: Record<string, string>): TreatyClientRoute;
	// HTTP methods
	get(opts?: Record<string, unknown>): Promise<unknown>;
	post(opts?: Record<string, unknown>): Promise<unknown>;
	patch(opts?: Record<string, unknown>): Promise<unknown>;
	delete(opts?: Record<string, unknown>): Promise<unknown>;
	// Nested routes: client.summary.get(), client({ id }).status.patch()
	[key: string]: TreatyClientRoute | ((opts?: Record<string, unknown>) => Promise<unknown>);
};

/**
 * Shape of an error returned by an Eden Treaty endpoint.
 */
export interface TreatyErrorShape {
	/** HTTP status code when available */
	status?: number;
	/** The raw error payload (string, Error, or object with message/error) */
	value: unknown;
}

/**
 * Generic treaty response envelope.
 *
 * @typeParam TData - The success data type
 */
export interface TreatyResponse<TData> {
	data: TData;
	error: TreatyErrorShape | null;
}

interface TreatyRoot {
	api?: Record<string, unknown>;
}

const clientRegistry = new Map<string, unknown>();

/**
 * Register a treaty client by name.
 *
 * Idempotent — calling twice with the same `name` overwrites the previous entry.
 *
 * @typeParam T - The client type for type-safe retrieval
 * @param name - Unique identifier for the client (typically the route key)
 * @param client - The treaty route object
 * @returns The `client` argument (for chaining or assignment)
 *
 * @example
 * ```ts
 * const bankingClient = registerClient("banking", treaty.api.banking)
 * ```
 *
 * @see {@link getClient} to retrieve a previously registered client
 */
export function registerClient<T>(name: string, client: T): T {
	clientRegistry.set(name, client);
	return client;
}

/**
 * Retrieve a previously registered treaty client by name.
 *
 * @typeParam T - The expected client type
 * @param name - The name used when registering the client
 * @returns The client, or `undefined` if not found
 *
 * @example
 * ```ts
 * const banking = getClient<typeof treaty.api.banking>("banking")
 * if (banking) { ... }
 * ```
 *
 * @see {@link registerClient}
 */
export function getClient<T>(name: string): T | undefined {
	return clientRegistry.get(name) as T | undefined;
}

/**
 * List all registered client names.
 *
 * @returns Array of client name strings (empty if none are registered)
 */
export function listClients(): string[] {
	return Array.from(clientRegistry.keys());
}

/**
 * Resolve a treaty route client from the Eden tree and register it.
 *
 * Searches first at the treaty root (`treaty[routeKey]`), then under `treaty.api`
 * (`treaty.api[routeKey]`). Registers the found client before returning.
 *
 * @typeParam TClient - The expected route client type
 * @param routeKey - Route key to resolve (e.g. `"booking"`, `"banking.accounts"`)
 * @returns The typed route client
 * @throws If the route key does not exist at either level of the treaty tree
 *
 * @example
 * ```ts
 * const booking = getTreatyRouteClient<typeof treaty.api.booking>("booking")
 * const result = await booking.get({ query: { companyId } })
 * ```
 *
 * @see {@link registerClient} called internally to cache the resolved client
 */
export function getTreatyRouteClient<TClient>(routeKey: string): TClient {
	const treatyRoot = api as unknown as TreatyRoot &
		Record<string, unknown>;
	const rootClient = treatyRoot[routeKey];
	if (rootClient) {
		registerClient(routeKey, rootClient);
		return rootClient as TClient;
	}

	const nestedClient = treatyRoot.api?.[routeKey];
	if (nestedClient) {
		registerClient(routeKey, nestedClient);
		return nestedClient as TClient;
	}

	throw new Error(`Eden route client '${routeKey}' is not configured`);
}

/**
 * Extract a human-readable error message from a treaty error shape.
 *
 * Cascading fallback order:
 * 1. If `error.value` is a string, use it directly
 * 2. If `error.value` is an `Error`, use `Error.message`
 * 3. If `error.value` is an object with a `message` property, use it
 * 4. If `error.value` is an object with an `error` property, use it
 * 5. Otherwise, return the `fallback` string
 *
 * @param error - The treaty error shape (can be `null` or `undefined`)
 * @param fallback - Default message if nothing useful is extracted
 * @returns A non-nullable string — either the extracted message or the fallback
 *
 * @example
 * ```ts
 * const msg = getTreatyErrorMessage(response.error, "Error al crear factura")
 * toast.error(msg)
 * ```
 */
export function getTreatyErrorMessage(
	error: TreatyErrorShape | null | undefined,
	fallback: string,
): string {
	if (!error) return fallback;
	if (typeof error.value === "string") return error.value;

	if (error.value instanceof Error) {
		return error.value.message;
	}

	if (typeof error.value === "object" && error.value !== null) {
		if ("message" in error.value && typeof error.value.message === "string") {
			return error.value.message;
		}

		if ("error" in error.value && typeof error.value.error === "string") {
			return error.value.error;
		}
	}

	return fallback;
}
