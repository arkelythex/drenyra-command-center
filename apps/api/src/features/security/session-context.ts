import { resolveAuthenticatedCaller } from "./authenticated-caller";

export const SESSION_SECURITY_PROFILE = {
	DEFAULT: "default",
	SENSITIVE_WRITE: "sensitive-write",
} as const;

export type SessionSecurityProfile =
	(typeof SESSION_SECURITY_PROFILE)[keyof typeof SESSION_SECURITY_PROFILE];

/**
 * Tenant-scoped identity extracted from request headers and validated against Better Auth.
 *
 * @example
 * ```ts
 * const ctx: SessionContext = { userId: 'usr_1', role: 'admin', companyId: 'cmp_1' };
 * ```
 */
export interface SessionContext {
	userId: string;
	authUserId: string;
	legacyUserId: string | null;
	role: string;
	companyId: string;
}

/**
 * Result of resolving the caller session context for a protected API operation.
 *
 * @example
 * ```ts
 * const result: SessionContextResult = {
 *   ok: true,
 *   context: { userId: 'usr_1', role: 'admin', companyId: 'cmp_1' },
 * };
 * ```
 */
export type SessionContextResult =
	| { ok: true; context: SessionContext }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  };

interface ResolveSessionContextInput {
	headers: Record<string, unknown>;
	requestedCompanyId?: string;
	requireSession?: boolean;
	allowHeaderFallback?: boolean;
	allowMachineCaller?: boolean;
	machineCallerAllowlist?: readonly string[];
	securityProfile?: SessionSecurityProfile;
}

function shouldRequireSession(requireSessionOverride?: boolean): boolean {
	if (typeof requireSessionOverride === "boolean")
		return requireSessionOverride;

	const env = (process.env.NODE_ENV ?? "").toLowerCase();
	if (env !== "test") return true;

	const enforceInTests = (
		process.env.SECURITY_ENFORCE_TEST_SESSION ?? ""
	).toLowerCase();
	return enforceInTests === "1" || enforceInTests === "true";
}

function resolveAllowHeaderFallback(
	input: ResolveSessionContextInput,
	requireSession: boolean,
): boolean {
	if (requireSession) return false;

	if (typeof input.allowHeaderFallback === "boolean") {
		return input.allowHeaderFallback;
	}

	if (input.securityProfile === SESSION_SECURITY_PROFILE.SENSITIVE_WRITE) {
		return false;
	}

	return true;
}

/**
 * Resolves the authenticated caller context from headers and optional Better Auth session state.
 *
 * @param input - Raw request headers plus optional tenant and session enforcement options.
 * @returns The validated session context or a normalized authorization error payload.
 * @example
 * ```ts
 * const result = await resolveSessionContext({
 *   headers: {
 *     'x-user-id': 'usr_1',
 *     'x-user-role': 'admin',
 *     'x-company-id': 'cmp_1',
 *   },
 *   requireSession: false,
 * });
 * ```
 */
export async function resolveSessionContext(
	input: ResolveSessionContextInput,
): Promise<SessionContextResult> {
	const requireSession = shouldRequireSession(input.requireSession);
	const allowHeaderFallback = resolveAllowHeaderFallback(input, requireSession);
	const caller = await resolveAuthenticatedCaller({
		headers: input.headers,
		requestedCompanyId: input.requestedCompanyId,
		requireSession,
		allowHeaderFallback,
		allowMachineCaller: input.allowMachineCaller,
		machineCallerAllowlist: input.machineCallerAllowlist,
		requireTenant: true,
		requireRole: true,
	});

	if (caller.ok === false) {
		return {
			ok: false,
			status: caller.status,
			code: caller.code,
			error: caller.error,
		};
	}

	return {
		ok: true,
		context: {
			userId: caller.caller.userId,
			authUserId: caller.caller.authUserId,
			legacyUserId: caller.caller.legacyUserId,
			role: caller.caller.role,
			companyId: caller.caller.companyId ?? "",
		},
	};
}
