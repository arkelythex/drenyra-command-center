import { vi } from "vitest";
import { auth } from "../../../auth/auth.config";

const SESSION_COMPANY_ID = "cmp-1";
const SESSION_AUTH_USER_ID = "auth-user-1";
const SESSION_LEGACY_USER_ID = "11111111-1111-1111-1111-111111111111";

/** Resolves every request in the test as an authenticated admin of one company. */
export function mockCompanySession(companyId = SESSION_COMPANY_ID): void {
	vi.spyOn(auth.api, "getSession").mockResolvedValue({
		session: { id: "sess-1" },
		user: {
			id: SESSION_AUTH_USER_ID,
			legacyUserId: SESSION_LEGACY_USER_ID,
			role: "ADMIN",
			companyId,
			activeCompanyId: companyId,
		},
	} as never);
}

/** A request carrying the session transport and the identity headers the guard cross-checks. */
export function authedRequest(
	url: string,
	init: RequestInit = {},
	companyId = SESSION_COMPANY_ID,
): Request {
	return new Request(url, {
		...init,
		headers: {
			cookie: "better-auth.session_token=test-session",
			"x-auth-user-id": SESSION_AUTH_USER_ID,
			"x-user-id": SESSION_LEGACY_USER_ID,
			"x-user-role": "admin",
			"x-company-id": companyId,
			...(init.headers as Record<string, string> | undefined),
		},
	});
}
