/**
 * RBAC Module — Barrel export.
 *
 * Import everything from here:
 * ```ts
 * import { hasBusinessPermission, UnifiedRole, ForbiddenError } from "@drenyra/security/rbac";
 * ```
 */

export {
	UNIFIED_ROLES,
	ROLE_HIERARCHY,
	SPECIAL_ROLE_MAPPINGS,
	isRoleHigher,
	getRoleLevel,
	resolveUnifiedRole,
} from "./unified-roles";
export type { UnifiedRole } from "./unified-roles";

export {
	BusinessPermission,
	PlatformPermission,
	ALL_BUSINESS_PERMISSIONS,
	ALL_PLATFORM_PERMISSIONS,
} from "./unified-permissions";
export type { Permission } from "./unified-permissions";

export {
	BUSINESS_ROLE_PERMISSION_MAP,
	PLATFORM_ROLE_PERMISSION_MAP,
	SERVICE_ROLE_OVERRIDE,
	AUDITOR_ROLE_OVERRIDE,
} from "./role-permission-map";

export {
	ForbiddenError,
	hasBusinessPermission,
	hasPlatformPermission,
	requireBusinessPermission,
	requirePlatformPermission,
	requireRole,
	requireMfa,
	getPermissionsForRole,
	resolveActor,
} from "./unified-guard";
export type { UnifiedActor } from "./unified-guard";

export { RBAC_FEATURE_FLAGS } from "./feature-flags";
export { logRbacDiscrepancy } from "./migration-audit";
export type { RbacDiscrepancy } from "./migration-audit";
