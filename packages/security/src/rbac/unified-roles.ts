/**
 * Unified Role Hierarchy — Canonical role definitions.
 *
 * Eight roles with strict numeric ordering. Two special roles (service, auditor)
 * map into the hierarchy at specific levels with overridden permission sets.
 *
 * @module unified-roles
 */

/**
 * Union of the 8 canonical role identifiers.
 *
 * `service` and `auditor` are NOT hierarchy levels; they are special roles
 * that resolve to `analyst` (4) and `viewer` (1) respectively with
 * restricted permission sets.
 */
export const UNIFIED_ROLES = {
	SUPERADMIN: "superadmin",
	ADMIN: "admin",
	OWNER: "owner",
	SENIOR: "senior",
	ANALYST: "analyst",
	JUNIOR: "junior",
	CLIENT: "client",
	VIEWER: "viewer",
} as const;

export type UnifiedRole = (typeof UNIFIED_ROLES)[keyof typeof UNIFIED_ROLES];

/**
 * Numeric hierarchy: higher number = more privilege.
 *
 * Role comparison uses `>=` — a role satisfies a requirement when its level
 * is at or above the required level.
 */
export const ROLE_HIERARCHY: Record<UnifiedRole, number> = {
	superadmin: 8,
	admin: 7,
	owner: 6,
	senior: 5,
	analyst: 4,
	junior: 3,
	client: 2,
	viewer: 1,
};

/**
 * Special roles that exist as database values but are NOT independent hierarchy
 * levels. They resolve to hierarchy levels and receive **overridden** permission
 * sets (see `role-permission-map.ts`).
 */
export const SPECIAL_ROLE_MAPPINGS: Record<
	string,
	{ mapsTo: UnifiedRole; level: number }
> = {
	service: { mapsTo: "analyst", level: 4 },
	auditor: { mapsTo: "viewer", level: 1 },
};

/**
 * Numeric comparison — returns `true` when `roleA` outranks `roleB`.
 *
 * @example
 * ```ts
 * isRoleHigher("admin", "senior"); // true  (7 > 5)
 * isRoleHigher("junior", "client"); // true  (3 > 2)
 * isRoleHigher("client", "owner");  // false (2 < 6)
 * ```
 */
export function isRoleHigher(roleA: UnifiedRole, roleB: UnifiedRole): boolean {
	return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/**
 * Returns the numeric level for a role. Falls back to -1 for unknown strings
 * so that un-mapped roles always fail permission checks.
 */
export function getRoleLevel(role: string): number {
	if (role in ROLE_HIERARCHY) {
		return ROLE_HIERARCHY[role as UnifiedRole];
	}
	if (role in SPECIAL_ROLE_MAPPINGS) {
		const mapping = SPECIAL_ROLE_MAPPINGS[role];
		if (mapping) return mapping.level;
	}
	return -1;
}

/**
 * Resolve a raw role string (which may be a special role like "service" or
 * "auditor") to a canonical `UnifiedRole`.
 */
export function resolveUnifiedRole(rawRole: string): UnifiedRole | null {
	const lower = rawRole.toLowerCase();
	if (lower in ROLE_HIERARCHY) return lower as UnifiedRole;
	if (lower in SPECIAL_ROLE_MAPPINGS) {
		const mapping = SPECIAL_ROLE_MAPPINGS[lower];
		if (mapping) return mapping.mapsTo;
	}
	return null;
}
