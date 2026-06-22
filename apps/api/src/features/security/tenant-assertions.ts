import type { HeaderContainer } from "../auth/handlers/session-identity";

export interface TenantAssertion {
	companyId: string | null;
	activeCompanyId: string | null;
}

export type TenantAssertionResult =
	| {
			ok: true;
			assertion: TenantAssertion;
	  }
	| {
			ok: false;
			status: 403;
			code: string;
			error: string;
	  };

export function readHeaderValue(
	headers: HeaderContainer | undefined,
	key: string,
): string {
	if (!headers) return "";

	if (headers instanceof Headers) {
		return headers.get(key) ?? headers.get(key.toLowerCase()) ?? "";
	}

	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();

	return "";
}

export function resolveTenantAssertion(
	headers: HeaderContainer | undefined,
): TenantAssertionResult {
	const companyId = readHeaderValue(headers, "x-company-id") || null;
	const activeCompanyId =
		readHeaderValue(headers, "x-active-company-id") || null;

	if (companyId && activeCompanyId && companyId !== activeCompanyId) {
		return {
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_CONFLICT",
			error:
				"x-company-id and x-active-company-id must reference the same tenant",
		};
	}

	return {
		ok: true,
		assertion: {
			companyId: activeCompanyId || companyId,
			activeCompanyId,
		},
	};
}
