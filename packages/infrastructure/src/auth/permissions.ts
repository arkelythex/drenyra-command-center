import type { User } from "./auth-utils";
import {
	hasBusinessPermission,
	isRoleHigher as unifiedIsRoleHigher,
	RBAC_FEATURE_FLAGS,
	type BusinessPermission,
	type UnifiedRole,
} from "@drenyra/security/rbac";

/**
 * ForbiddenError class.
 *
 * @example
 * ```ts
 * const value = new ForbiddenError();
 * console.log(value);
 * ```
 */
export class ForbiddenError extends Error {
	constructor(message: string = "Forbidden") {
		super(message);
		this.name = "ForbiddenError";
	}
}

/**
 * @deprecated Use `UnifiedRole` from `@drenyra/security/rbac` instead.
 */
export type Role = "owner" | "senior" | "junior" | "client";

/**
 * @deprecated Use `UNIFIED_ROLES` from `@drenyra/security/rbac` instead.
 */
export const ROLES = {
	OWNER: "owner" as const,
	SENIOR: "senior" as const,
	JUNIOR: "junior" as const,
	CLIENT: "client" as const,
};

/**
 * @deprecated Use `BusinessPermission` from `@drenyra/security/rbac` instead.
 */
export type Permission =
	| "company:create"
	| "company:delete"
	| "company:update"
	| "company:read"
	| "journal:read"
	| "journal:create"
	| "journal:update"
	| "journal:update_draft"
	| "journal:delete"
	| "sunat:declare"
	| "sunat:read"
	| "accounting:close"
	| "accounting:open"
	| "reports:read_all"
	| "reports:read_operational"
	| "reports:read_basic"
	| "payroll:read"
	| "payroll:manage"
	| "users:create_staff"
	| "users:invite_team"
	| "users:read"
	| "audit:read";

// ── Legacy role-permission map (fallback when unified disabled) ──

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
	owner: [
		"company:create",
		"company:delete",
		"company:update",
		"company:read",
		"journal:read",
		"journal:create",
		"journal:update",
		"journal:update_draft",
		"journal:delete",
		"sunat:declare",
		"sunat:read",
		"accounting:close",
		"accounting:open",
		"reports:read_all",
		"reports:read_operational",
		"reports:read_basic",
		"payroll:read",
		"payroll:manage",
		"users:create_staff",
		"users:invite_team",
		"users:read",
		"audit:read",
	],
	senior: [
		"company:update",
		"company:read",
		"journal:read",
		"journal:create",
		"journal:update",
		"journal:update_draft",
		"journal:delete",
		"sunat:declare",
		"sunat:read",
		"accounting:close",
		"reports:read_all",
		"reports:read_operational",
		"reports:read_basic",
		"payroll:read",
		"payroll:manage",
		"users:read",
	],
	junior: [
		"company:read",
		"journal:read",
		"journal:create",
		"journal:update_draft",
		"sunat:read",
		"reports:read_operational",
		"reports:read_basic",
		"users:read",
	],
	client: [
		"company:read",
		"reports:read_basic",
		"payroll:read",
		"users:invite_team",
	],
};

// ── Legacy hierarchy (fallback) ──

const LEGACY_ROLE_HIERARCHY: Record<Role, number> = {
	client: 1,
	junior: 2,
	senior: 3,
	owner: 4,
};

// ── Mapping helpers ──

/**
 * Maps a legacy Role to the unified role hierarchy.
 */
function mapLegacyRole(role: Role): UnifiedRole {
	switch (role) {
		case "owner":
			return "owner";
		case "senior":
			return "senior";
		case "junior":
			return "junior";
		case "client":
			return "client";
	}
}

/**
 * Maps a legacy Permission to a `business:`-prefixed BusinessPermission.
 */
function mapLegacyPermission(perm: Permission): BusinessPermission {
	return `business:${perm}` as BusinessPermission;
}

// ── Guard functions (with unified delegation) ──

/**
 * @deprecated Use `hasBusinessPermission()` from `@drenyra/security/rbac` instead.
 *
 * Checks whether a role has a given permission.
 * When `UNIFIED_RBAC_ENABLED` is true, delegates to the unified guard.
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
	if (RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED) {
		return hasBusinessPermission(
			mapLegacyRole(role),
			mapLegacyPermission(permission),
		);
	}

	// Fallback: original logic
	const permissions = ROLE_PERMISSIONS[role];
	return permissions.includes(permission);
}

/**
 * @deprecated Use `hasBusinessPermission()` from `@drenyra/security/rbac` instead.
 */
export function userHasPermission(user: User, permission: Permission): boolean {
	return roleHasPermission(user.role as Role, permission);
}

/**
 * @deprecated Use `requireBusinessPermission()` from `@drenyra/security/rbac` instead.
 *
 * Asserts permission; throws `ForbiddenError` on denial.
 * When `UNIFIED_RBAC_ENABLED` is true, delegates to the unified guard.
 */
export function requirePermission(user: User, permission: Permission): void {
	if (!userHasPermission(user, permission)) {
		throw new ForbiddenError(
			`Permission denied: ${permission} (your role: ${user.role})`,
		);
	}
}

/**
 * @deprecated Use `isRoleHigher()` from `@drenyra/security/rbac` instead.
 *
 * When unified is enabled, delegates to the unified hierarchy (8 levels).
 * Otherwise uses the legacy 4-level hierarchy.
 */
export function isRoleHigher(roleA: Role, roleB: Role): boolean {
	if (RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED) {
		return unifiedIsRoleHigher(mapLegacyRole(roleA), mapLegacyRole(roleB));
	}

	return LEGACY_ROLE_HIERARCHY[roleA] > LEGACY_ROLE_HIERARCHY[roleB];
}
