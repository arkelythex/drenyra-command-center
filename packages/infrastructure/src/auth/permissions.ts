import type { User } from "./auth-utils";

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
 * Role type.
 *
 * @example
 * ```ts
 * const value: Role = {} as Role;
 * console.log(value);
 * ```
 */
export type Role = "owner" | "senior" | "junior" | "client";

/**
 * ROLES const.
 *
 * @example
 * ```ts
 * console.log(ROLES);
 * ```
 */
export const ROLES = {
	OWNER: "owner" as const,
	SENIOR: "senior" as const,
	JUNIOR: "junior" as const,
	CLIENT: "client" as const,
};

/**
 * Permission type.
 *
 * @example
 * ```ts
 * const value: Permission = {} as Permission;
 * console.log(value);
 * ```
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

/**
 * roleHasPermission operation.
 *
 * @param role - Input for role.
 * @param permission - Input for permission.
 * @returns Result of roleHasPermission.
 * @example
 * ```ts
 * const result = roleHasPermission({} as Role, {} as Permission);
 * console.log(result);
 * ```
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
	const permissions = ROLE_PERMISSIONS[role];
	return permissions.includes(permission);
}

/**
 * userHasPermission operation.
 *
 * @param user - Input for user.
 * @param permission - Input for permission.
 * @returns Result of userHasPermission.
 * @example
 * ```ts
 * const result = userHasPermission({} as User, {} as Permission);
 * console.log(result);
 * ```
 */
export function userHasPermission(user: User, permission: Permission): boolean {
	return roleHasPermission(user.role as Role, permission);
}

/**
 * requirePermission operation.
 *
 * @param user - Input for user.
 * @param permission - Input for permission.
 * @returns Result of requirePermission.
 * @throws Error when requirePermission cannot complete successfully.
 * @example
 * ```ts
 * const result = requirePermission({} as User, {} as Permission);
 * console.log(result);
 * ```
 */
export function requirePermission(user: User, permission: Permission): void {
	if (!userHasPermission(user, permission)) {
		throw new ForbiddenError(
			`Permission denied: ${permission} (your role: ${user.role})`,
		);
	}
}

const ROLE_HIERARCHY: Record<Role, number> = {
	client: 1,
	junior: 2,
	senior: 3,
	owner: 4,
};

/**
 * isRoleHigher operation.
 *
 * @param roleA - Input for roleA.
 * @param roleB - Input for roleB.
 * @returns Result of isRoleHigher.
 * @example
 * ```ts
 * const result = isRoleHigher({} as Role, {} as Role);
 * console.log(result);
 * ```
 */
export function isRoleHigher(roleA: Role, roleB: Role): boolean {
	return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}
