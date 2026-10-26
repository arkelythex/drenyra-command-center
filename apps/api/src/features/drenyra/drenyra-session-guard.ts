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

export function drenyraSessionGuard() {
	return (app: Elysia) =>
		app.onBeforeHandle({ as: "global" }, async ({ request, headers, set }) => {
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

			const claimedCompany = header(headers, "x-company-id");
			const claimedUser = header(headers, "x-user-id");
			const sameCompany =
				claimedCompany === null || claimedCompany === session.context.companyId;
			const sameUser =
				claimedUser === null ||
				claimedUser === session.context.userId ||
				claimedUser === session.context.authUserId;

			if (!sameCompany || !sameUser) {
				set.status = 403;
				return fail(
					"The scope headers do not match the authenticated session",
					"TENANT_MISMATCH",
				);
			}
			return undefined;
		});
}
