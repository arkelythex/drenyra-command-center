import { logSecurityAccess } from "./access-log.service";
import { hasPermission, type SecurityOperation } from "./rbac-policy";
import { resolveSessionContext } from "./session-context";
import {
	hasPlatformPermission,
	RBAC_FEATURE_FLAGS,
	logRbacDiscrepancy,
} from "@drenyra/security/rbac";

/**
 * Request context required to authorize an operation against Arkelythex security policy.
 */
export interface AuthorizationInput {
	headers: Record<string, unknown>;
	operation: SecurityOperation;
	resource: string;
	requestedCompanyId?: string;
	requireSession?: boolean;
	allowMachineCaller?: boolean;
}

/** Result of authorizing a secured operation. */
export type AuthorizationResult =
	| {
			ok: true;
			actor: {
				userId: string;
				authUserId: string;
				legacyUserId: string | null;
				role: string;
				companyId: string;
			};
	  }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  };

function readHeader(headers: Record<string, unknown>, key: string): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();

	return "";
}

function shouldBypassRbacInTests(): boolean {
	const env = (process.env.NODE_ENV ?? "").toLowerCase();
	if (env !== "test") return false;

	const enforce = (process.env.SECURITY_ENFORCE_TEST_RBAC ?? "").toLowerCase();
	return !(enforce === "1" || enforce === "true");
}

/**
 * Evaluates the unified guard for a given actor + operation and returns the
 * decision as "ALLOW" | "DENY".
 */
function evaluateUnifiedGuard(
	role: string,
	operation: string,
): "ALLOW" | "DENY" {
	const platformPerm = `platform:${operation}`;
	return hasPlatformPermission(role, platformPerm) ? "ALLOW" : "DENY";
}

/**
 * Resolves session context, applies RBAC, and logs the authorization outcome.
 *
 * Supports dual-write migration: when `UNIFIED_RBAC_ENABLED=false` and
 * `DUAL_WRITE_SHADOW_MODE=true`, the old guard decides but the unified guard
 * runs in parallel and discrepancies are logged.
 */
export async function authorizeOperation(
	input: AuthorizationInput,
): Promise<AuthorizationResult> {
	// Build resolve input respecting exactOptionalPropertyTypes
	const resolveInput = {
		headers: input.headers,
		...(input.requestedCompanyId !== undefined
			? { requestedCompanyId: input.requestedCompanyId }
			: {}),
		...(input.requireSession !== undefined
			? { requireSession: input.requireSession }
			: {}),
		...(input.allowMachineCaller !== undefined
			? { allowMachineCaller: input.allowMachineCaller }
			: {}),
	};
	const sessionContext = await resolveSessionContext(resolveInput);

	if (sessionContext.ok === false) {
		const failure = {
			ok: false as const,
			status: sessionContext.status,
			code: sessionContext.code,
			error: sessionContext.error,
		};
		const ipAddress =
			readHeader(input.headers, "x-forwarded-for") ||
			readHeader(input.headers, "x-real-ip");
		const userAgent = readHeader(input.headers, "user-agent");

		await logSecurityAccess({
			action: input.operation,
			resource: input.resource,
			result: "FAILED",
			ipAddress,
			userAgent,
			details: {
				code: failure.code,
				reason: failure.error,
			},
		});

		return failure;
	}

	const actor = sessionContext.context;

	if (shouldBypassRbacInTests()) {
		return { ok: true, actor };
	}

	const ipAddress =
		readHeader(input.headers, "x-forwarded-for") ||
		readHeader(input.headers, "x-real-ip");
	const userAgent = readHeader(input.headers, "user-agent");

	// ── Unified RBAC path (cutover) ──
	if (RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED) {
		const allowed = evaluateUnifiedGuard(actor.role, input.operation);

		if (!allowed) {
			await logSecurityAccess({
				action: input.operation,
				resource: input.resource,
				result: "DENY",
				userId: actor.authUserId,
				ipAddress,
				userAgent,
				details: {
					role: actor.role,
					companyId: actor.companyId,
					legacyUserId: actor.legacyUserId,
					guard: "unified",
				},
			});

			return {
				ok: false,
				status: 403,
				code: "FORBIDDEN_ROLE",
				error: `Role "${actor.role}" is not allowed for operation ${input.operation}`,
			};
		}

		await logSecurityAccess({
			action: input.operation,
			resource: input.resource,
			result: "ALLOW",
			userId: actor.authUserId,
			ipAddress,
			userAgent,
			details: {
				role: actor.role,
				companyId: actor.companyId,
				legacyUserId: actor.legacyUserId,
				guard: "unified",
			},
		});

		return { ok: true, actor };
	}

	// ── Legacy path (old guard decides) ──
	const oldAllowed = hasPermission(actor.role, input.operation);

	// ── Dual-write shadow mode ──
	if (RBAC_FEATURE_FLAGS.DUAL_WRITE_SHADOW_MODE) {
		const unifiedResult = evaluateUnifiedGuard(actor.role, input.operation);
		const oldResult: "ALLOW" | "DENY" = oldAllowed ? "ALLOW" : "DENY";

		if (oldResult !== unifiedResult) {
			logRbacDiscrepancy(
				input.resource,
				input.operation,
				actor.role,
				oldResult,
				unifiedResult,
			);
		}
	}

	if (!oldAllowed) {
		await logSecurityAccess({
			action: input.operation,
			resource: input.resource,
			result: "DENY",
			userId: actor.authUserId,
			ipAddress,
			userAgent,
			details: {
				role: actor.role,
				companyId: actor.companyId,
				legacyUserId: actor.legacyUserId,
				guard: "legacy",
			},
		});

		return {
			ok: false,
			status: 403,
			code: "FORBIDDEN_ROLE",
			error: `Role "${actor.role}" is not allowed for operation ${input.operation}`,
		};
	}

	await logSecurityAccess({
		action: input.operation,
		resource: input.resource,
		result: "ALLOW",
		userId: actor.authUserId,
		ipAddress,
		userAgent,
		details: {
			role: actor.role,
			companyId: actor.companyId,
			legacyUserId: actor.legacyUserId,
			guard: "legacy",
		},
	});

	return { ok: true, actor };
}
