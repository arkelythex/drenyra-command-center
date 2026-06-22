import { resolveAuthenticatedCaller } from "../security/authenticated-caller";
import { readHeaderValue } from "../security/tenant-assertions";

/**
 * RequestRole type.
 *
 * @example
 * ```ts
 * const value: RequestRole = {} as RequestRole;
 * console.log(value);
 * ```
 */
export type RequestRole = string;

/**
 * RequestAccessContext interface.
 *
 * @example
 * ```ts
 * const value: RequestAccessContext = {} as RequestAccessContext;
 * console.log(value);
 * ```
 */
export interface RequestAccessContext {
	userId: string;
	authUserId: string;
	legacyUserId: string | null;
	companyId: string;
	role: RequestRole;
}

/**
 * RequestAccessResult type.
 *
 * @example
 * ```ts
 * const value: RequestAccessResult = {} as RequestAccessResult;
 * console.log(value);
 * ```
 */
export type RequestAccessResult =
	| { ok: true; context: RequestAccessContext }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  };

const DEFAULT_ALLOWED_AUDIT_ROLES = ["owner", "senior", "admin", "superadmin"];

/**
 * resolveGovernanceAuditAccess operation.
 *
 * @param headers - Input for headers.
 * @param requestedCompanyId - Input for requestedCompanyId.
 * @returns Result of resolveGovernanceAuditAccess.
 * @example
 * ```ts
 * const result = await resolveGovernanceAuditAccess({} as Record, "");
 * console.log(result);
 * ```
 */
export async function resolveGovernanceAuditAccess(
	headers: Record<string, unknown>,
	requestedCompanyId: string,
): Promise<RequestAccessResult> {
	const headerFallback = allowHeaderOnlyAuth();
	const caller = await resolveAuthenticatedCaller({
		headers,
		requestedCompanyId,
		requireSession: !headerFallback,
		allowHeaderFallback: headerFallback,
		requireTenant: true,
		requireRole: true,
	});

	if (!caller.ok) {
		return caller;
	}

	const allowedRoles = getAllowedAuditRoles();
	if (!allowedRoles.includes(caller.caller.role)) {
		return {
			ok: false,
			status: 403,
			code: "FORBIDDEN_ROLE",
			error: `Role "${caller.caller.role}" is not allowed to access governance audit`,
		};
	}

	return {
		ok: true,
		context: {
			userId: caller.caller.userId,
			authUserId: caller.caller.authUserId,
			legacyUserId: caller.caller.legacyUserId,
			companyId: caller.caller.companyId ?? requestedCompanyId,
			role: caller.caller.role,
		},
	};
}

/**
 * resolveGovernanceMetricsAccess operation.
 *
 * @param headers - Input for headers.
 * @returns Result of resolveGovernanceMetricsAccess.
 * @example
 * ```ts
 * const result = await resolveGovernanceMetricsAccess({} as Record);
 * console.log(result);
 * ```
 */
export async function resolveGovernanceMetricsAccess(
	headers: Record<string, unknown>,
): Promise<RequestAccessResult> {
	const headerFallback = allowHeaderOnlyAuth();
	const caller = await resolveAuthenticatedCaller({
		headers,
		requireSession: !headerFallback,
		allowHeaderFallback: headerFallback,
		requireTenant: false,
		requireRole: true,
	});

	if (!caller.ok) {
		return caller;
	}

	const allowedRoles = getAllowedAuditRoles();
	if (!allowedRoles.includes(caller.caller.role)) {
		return {
			ok: false,
			status: 403,
			code: "FORBIDDEN_ROLE",
			error: `Role "${caller.caller.role}" is not allowed to access governance metrics`,
		};
	}

	return {
		ok: true,
		context: {
			userId: caller.caller.userId,
			authUserId: caller.caller.authUserId,
			legacyUserId: caller.caller.legacyUserId,
			companyId:
				caller.caller.companyId ??
				(readHeaderValue(headers, "x-company-id") || "global"),
			role: caller.caller.role,
		},
	};
}

function getAllowedAuditRoles(): string[] {
	const raw = (process.env.GOVERNANCE_AUDIT_ALLOWED_ROLES ?? "").trim();
	if (!raw) return DEFAULT_ALLOWED_AUDIT_ROLES;
	const parsed = raw
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
	return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_AUDIT_ROLES;
}

function allowHeaderOnlyAuth(): boolean {
	if ((process.env.NODE_ENV ?? "").toLowerCase() === "test") {
		return true;
	}

	const raw = (process.env.GOVERNANCE_AUDIT_ALLOW_HEADER_AUTH_FALLBACK ?? "")
		.trim()
		.toLowerCase();
	return raw === "1" || raw === "true" || raw === "yes";
}
