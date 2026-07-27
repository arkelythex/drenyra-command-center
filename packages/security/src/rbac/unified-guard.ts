/**
 * Unified Guard Functions — Authorization API.
 *
 * All permission checks across the codebase should eventually route through
 * these functions. They are the single entry point for RBAC decisions.
 *
 * @module unified-guard
 */

import type { UnifiedRole } from "./unified-roles";
import {
	ROLE_HIERARCHY,
	SPECIAL_ROLE_MAPPINGS,
	getRoleLevel,
} from "./unified-roles";
import type {
	BusinessPermission,
	PlatformPermission,
} from "./unified-permissions";
import {
	BUSINESS_ROLE_PERMISSION_MAP,
	PLATFORM_ROLE_PERMISSION_MAP,
	SERVICE_ROLE_OVERRIDE,
	AUDITOR_ROLE_OVERRIDE,
} from "./role-permission-map";

// ── ForbiddenError ──

/**
 * Local ForbiddenError to avoid a circular dependency on
 * `@drenyra/infrastructure/auth`. Callers that already import the legacy
 * `ForbiddenError` can keep doing so; the unified guards throw this one.
 */
export class ForbiddenError extends Error {
	constructor(message = "Prohibido — permisos insuficientes") {
		super(message);
		this.name = "ForbiddenError";
	}
}

// ── Actor ──

/**
 * Normalised identity used by all unified guards.
 */
export interface UnifiedActor {
	userId: string;
	authUserId: string;
	legacyUserId: string | null;
	role: UnifiedRole;
	companyId: string;
}

// ── Business permission checks ──

/**
 * Returns `true` when the role (or its special-role override) grants the
 * given business permission.
 */
export function hasBusinessPermission(
	role: UnifiedRole | string,
	permission: BusinessPermission | string,
): boolean {
	// Special roles override
	if (role === "service") return false; // service has NO business permissions
	if (role === "auditor") return false; // auditor has NO business permissions

	const perms = BUSINESS_ROLE_PERMISSION_MAP[role as UnifiedRole];
	if (!perms) return false;
	return perms.has(permission as BusinessPermission);
}

/**
 * Returns `true` when the role (or its special-role override) grants the
 * given platform permission.
 */
export function hasPlatformPermission(
	role: UnifiedRole | string,
	permission: PlatformPermission | string,
): boolean {
	// Special roles: service
	if (role === "service") {
		return SERVICE_ROLE_OVERRIDE.has(permission as PlatformPermission);
	}
	// Special roles: auditor
	if (role === "auditor") {
		return AUDITOR_ROLE_OVERRIDE.has(permission as PlatformPermission);
	}

	const perms = PLATFORM_ROLE_PERMISSION_MAP[role as UnifiedRole];
	if (!perms) return false;
	return perms.has(permission as PlatformPermission);
}

// ── Assertion helpers ──

/**
 * Asserts a business permission; throws `ForbiddenError` on denial.
 */
export function requireBusinessPermission(
	actor: UnifiedActor,
	permission: BusinessPermission,
): void {
	if (!hasBusinessPermission(actor.role, permission)) {
		throw new ForbiddenError(
			`Permiso denegado: ${permission} (tu rol: ${actor.role})`,
		);
	}
}

/**
 * Asserts a platform permission; throws `ForbiddenError` on denial.
 */
export function requirePlatformPermission(
	actor: UnifiedActor,
	permission: PlatformPermission,
): void {
	if (!hasPlatformPermission(actor.role, permission)) {
		throw new ForbiddenError(
			`Permiso denegado: ${permission} (tu rol: ${actor.role})`,
		);
	}
}

/**
 * Asserts a minimum role level; throws `ForbiddenError` if the actor's role
 * is below the required level.
 */
export function requireRole(
	actor: UnifiedActor,
	requiredRole: UnifiedRole,
): void {
	const actorLevel = getRoleLevel(actor.role);
	const requiredLevel = ROLE_HIERARCHY[requiredRole];
	if (actorLevel < requiredLevel) {
		throw new ForbiddenError(
			`Permiso denegado: se requiere rol ${requiredRole} o superior (tu rol: ${actor.role})`,
		);
	}
}

/**
 * Placeholder MFA check — always passes in Phase 1.
 *
 * In Phase 2 this will verify `session.mfaVerified` and throw if MFA is
 * required but not satisfied.
 */
export function requireMfa(_actor: UnifiedActor): void {
	// Phase 1: no-op. Phase 2 will implement MFA step-up.
}

// ── Introspection ──

/**
 * Returns all permissions granted to a role (business + platform).
 */
export function getPermissionsForRole(role: UnifiedRole): {
	business: BusinessPermission[];
	platform: PlatformPermission[];
} {
	return {
		business: [...(BUSINESS_ROLE_PERMISSION_MAP[role] ?? [])],
		platform: [...(PLATFORM_ROLE_PERMISSION_MAP[role] ?? [])],
	};
}

// ── Actor resolution ──

function readHeader(headers: Record<string, unknown>, key: string): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();

	return "";
}

/**
 * Extracts a `UnifiedActor` from request headers (and optionally a session).
 *
 * This is a **placeholder** — in Phase 1 it delegates to the existing
 * session-context resolution. Call sites should migrate to `resolveActor`
 * over time so that when session-context is updated (Task 1.14), the
 * bridging is seamless.
 */
export function resolveActor(
	headers: Record<string, unknown>,
	_session?: unknown,
): UnifiedActor | null {
	const authUserId = readHeader(headers, "x-auth-user-id");
	const legacyUserId = readHeader(headers, "x-user-id");
	const userId = authUserId || legacyUserId;
	const role = readHeader(headers, "x-user-role").toLowerCase();
	const companyId = readHeader(headers, "x-company-id") || "global";

	if (!userId || !role) return null;

	return {
		userId,
		authUserId: authUserId || userId,
		legacyUserId: legacyUserId || null,
		role: role as UnifiedRole,
		companyId,
	};
}
