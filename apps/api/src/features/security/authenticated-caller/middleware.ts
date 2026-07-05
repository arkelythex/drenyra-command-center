import { resolveSessionIdentityFromHeaders } from "../../auth/handlers/session-identity";
import { readHeaderValue, resolveTenantAssertion } from "../tenant-assertions";
import {
	AUTHENTICATED_CALLER_KIND,
	hasSpoofableHeaderContext,
	normalizeRole,
	resolveHeaderFallbackCaller,
	resolveMachineCallerAllowlist,
	resolveSignedMachineCaller,
	shouldRequireSession,
	validateRoleRequirement,
	validateTenantScope,
} from "./helpers";
import type {
	AuthenticatedCallerResult,
	ResolveAuthenticatedCallerInput,
} from "./types";

export async function resolveAuthenticatedCaller(
	input: ResolveAuthenticatedCallerInput,
): Promise<AuthenticatedCallerResult> {
	const requireSession = shouldRequireSession(input.requireSession);
	const requireTenant = input.requireTenant ?? true;
	const requireRole = input.requireRole ?? true;
	const tenantAssertion = resolveTenantAssertion(input.headers);
	if (tenantAssertion.ok === false) {
		return {
			ok: false,
			status: tenantAssertion.status,
			code: tenantAssertion.code,
			error: tenantAssertion.error,
		};
	}

	const assertedCompanyId = tenantAssertion.assertion.companyId;
	const assertedAuthUserId = readHeaderValue(input.headers, "x-auth-user-id");
	const assertedLegacyUserId =
		readHeaderValue(input.headers, "x-user-id") || null;
	const assertedRole = normalizeRole(
		readHeaderValue(input.headers, "x-user-role"),
	);

	const sessionIdentity = await resolveSessionIdentityFromHeaders(
		input.headers,
	);
	if (sessionIdentity.authUserId) {
		if (
			assertedAuthUserId &&
			sessionIdentity.authUserId !== assertedAuthUserId
		) {
			return {
				ok: false,
				status: 403,
				code: "AUTH_CONTEXT_MISMATCH",
				error: "Session user does not match x-auth-user-id header",
			};
		}

		if (
			assertedLegacyUserId &&
			sessionIdentity.legacyUserId &&
			sessionIdentity.legacyUserId !== assertedLegacyUserId
		) {
			return {
				ok: false,
				status: 403,
				code: "AUTH_CONTEXT_MISMATCH",
				error: "Session legacy user does not match x-user-id header",
			};
		}

		const effectiveRole = normalizeRole(sessionIdentity.role ?? assertedRole);
		if (assertedRole && effectiveRole && assertedRole !== effectiveRole) {
			return {
				ok: false,
				status: 403,
				code: "AUTH_CONTEXT_MISMATCH",
				error: "Session role does not match x-user-role header",
			};
		}

		const tenantValidation = validateTenantScope(
			sessionIdentity.activeCompanyId || sessionIdentity.companyId,
			assertedCompanyId,
			input.requestedCompanyId,
			requireTenant,
		);
		if (tenantValidation) {
			return tenantValidation;
		}

		const roleValidation = validateRoleRequirement(effectiveRole, requireRole);
		if (roleValidation) {
			return roleValidation;
		}

		return {
			ok: true,
			caller: {
				kind: AUTHENTICATED_CALLER_KIND.SESSION,
				userId: sessionIdentity.authUserId,
				authUserId: sessionIdentity.authUserId,
				legacyUserId: sessionIdentity.legacyUserId,
				role: effectiveRole,
				companyId: sessionIdentity.activeCompanyId || sessionIdentity.companyId,
				sessionId: sessionIdentity.sessionId,
				serviceId: null,
			},
		};
	}

	if (input.allowMachineCaller) {
		const machineCallerAllowlist = resolveMachineCallerAllowlist(
			input.machineCallerAllowlist,
		);
		const machineCaller = resolveSignedMachineCaller(
			input.headers,
			machineCallerAllowlist,
		);
		if (machineCaller) {
			if (!machineCaller.ok) return machineCaller;

			const roleValidation = validateRoleRequirement(
				machineCaller.caller.role,
				requireRole,
			);
			if (roleValidation) {
				return roleValidation;
			}

			const tenantValidation = validateTenantScope(
				machineCaller.caller.companyId,
				assertedCompanyId,
				input.requestedCompanyId,
				requireTenant,
			);
			if (tenantValidation) {
				return tenantValidation;
			}

			return machineCaller;
		}
	}

	if (requireSession) {
		return {
			ok: false,
			status: 401,
			code: "SESSION_REQUIRED",
			error: "Active BetterAuth session is required for this operation",
		};
	}

	if (!input.allowHeaderFallback) {
		if (hasSpoofableHeaderContext(input.headers)) {
			return {
				ok: false,
				status: 403,
				code: "SPOOFABLE_HEADER_CONTEXT",
				error:
					"Header-only caller context is not allowed for this route. Use a session or a signed machine caller.",
			};
		}

		return {
			ok: false,
			status: 401,
			code: "AUTH_REQUIRED",
			error: "No active session. Sign in and retry.",
		};
	}

	const headerFallback = resolveHeaderFallbackCaller(
		input.headers,
		assertedCompanyId,
		requireRole,
	);
	if (!headerFallback.ok) return headerFallback;

	const tenantValidation = validateTenantScope(
		headerFallback.caller.companyId,
		assertedCompanyId,
		input.requestedCompanyId,
		requireTenant,
	);
	if (tenantValidation) {
		return tenantValidation;
	}

	return headerFallback;
}
