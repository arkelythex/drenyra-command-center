/**
 * Session guard for the whole `/api/drenyra/*` surface.
 *
 * The Drenyra routes build their actor from `x-company-id` / `x-user-id`
 * headers. Those are client-controlled, and the app-wide scope guard still
 * allows a header fallback, so without this guard anyone could act as any
 * company by sending headers. Here the caller must have a real session and
 * the scope headers must be the session's own, never someone else's.
 *
 * `/api/drenyra/contract` stays public: it only describes the surface.
 */

import type { Elysia } from "elysia";
import { resolveSessionContext } from "../security/session-context";
import { fail } from "../shared/api-response";

const DRENYRA_PREFIX = "/api/drenyra";
const PUBLIC_PATHS = new Set([`${DRENYRA_PREFIX}/contract`]);

function pathOf(url: string): string {
	try {
		return new URL(url).pathname;
	} catch {
		return url;
	}
}

function isGuarded(path: string): boolean {
	if (PUBLIC_PATHS.has(path)) return false;
	return path === DRENYRA_PREFIX || path.startsWith(`${DRENYRA_PREFIX}/`);
}

function header(headers: Record<string, unknown>, name: string): string | null {
	const value = headers[name];
	const text = Array.isArray(value) ? value[0] : value;
	return typeof text === "string" && text.trim() !== "" ? text.trim() : null;
}

/** A string field of a query or JSON body, when it is one. */
function text(source: unknown, key: string): string | null {
	if (typeof source !== "object" || source === null) return null;
	const value = (source as Record<string, unknown>)[key];
	return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function drenyraSessionGuard() {
	return (app: Elysia) =>
		app.onBeforeHandle(
			{ as: "global" },
			async ({ request, headers, query, body, set }) => {
				if (!isGuarded(pathOf(request.url))) return undefined;

				const session = await resolveSessionContext({
					headers: headers as Record<string, unknown>,
					requireSession: true,
					allowHeaderFallback: false,
				});

				if (!session.ok) {
					set.status = session.status;
					return fail(session.error, session.code);
				}

				const claimedCompanies = [
					header(headers, "x-company-id"),
					text(query, "companyId"),
					text(body, "companyId"),
				];
				const claimedUser = header(headers, "x-user-id");
				const sessionUsers = [
					session.context.userId,
					session.context.authUserId,
					session.context.legacyUserId,
				];
				const sameCompany = claimedCompanies.every(
					(claimed) =>
						claimed === null || claimed === session.context.companyId,
				);
				const sameUser =
					claimedUser === null || sessionUsers.includes(claimedUser);

				if (!sameCompany || !sameUser) {
					set.status = 403;
					return fail(
						"The scope headers do not match the authenticated session",
						"TENANT_MISMATCH",
					);
				}
				return undefined;
			},
		);
}
