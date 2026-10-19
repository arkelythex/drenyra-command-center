/**
 * API client: Eden Treaty over the Elysia API (`/api/*`).
 *
 * Requests carry the session cookie (`credentials: "include"`) and the active
 * company as tenant headers, so the API's company scope guard can check them.
 */

import { treaty } from "@elysiajs/eden";
import { readActiveCompanyState } from "./company-context";
import { runtimeConfig } from "./runtime-config";

/**
 * Untyped treaty tree. The typed `App` contract (`@drenyra/api/contract`) would
 * pull the whole API source into the web typecheck, so call sites type their
 * payloads at the boundary (see `unwrap` / `extractOkData`).
 */
// biome-ignore lint/suspicious/noExplicitAny: dynamic Eden Treaty proxy, typed at call sites
export type ApiTreaty = any;

/** Tenant headers for the active company; empty until a session sets one. */
export function resolveRequestHeaders(): Record<string, string> {
	const companyId = readActiveCompanyState()?.active.companyId?.trim();
	if (!companyId) return {};
	return { "x-company-id": companyId, "x-active-company-id": companyId };
}

export const api: ApiTreaty = treaty(runtimeConfig.apiUrl, {
	fetch: { credentials: "include" },
	headers: resolveRequestHeaders,
});
