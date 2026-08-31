/**
 * RBAC Module — Barrel export.
 *
 * Import everything from here:
 * ```ts
 * import { hasBusinessPermission, UnifiedRole, ForbiddenError } from "@drenyra/security/rbac";
 * ```
 */

export { RBAC_FEATURE_FLAGS } from "./feature-flags";
export type { RbacDiscrepancy } from "./migration-audit";
export { logRbacDiscrepancy } from "./migration-audit";
export {
	AUDITOR_ROLE_OVERRIDE,
	BUSINESS_ROLE_PERMISSION_MAP,
	PLATFORM_ROLE_PERMISSION_MAP,
	SERVICE_ROLE_OVERRIDE,
} from "./role-permission-map";
export type { UnifiedActor } from "./unified-guard";

export {
	ForbiddenError,
	getPermissionsForRole,
	hasBusinessPermission,
	hasPlatformPermission,
	requireBusinessPermission,
	requireMfa,
	requirePlatformPermission,
	requireRole,
	resolveActor,
} from "./unified-guard";
export type { Permission } from "./unified-permissions";
export {
	ALL_BUSINESS_PERMISSIONS,
	ALL_PLATFORM_PERMISSIONS,
	BusinessPermission,
	PlatformPermission,
} from "./unified-permissions";
export type { UnifiedRole } from "./unified-roles";
export {
	getRoleLevel,
	isRoleHigher,
	ROLE_HIERARCHY,
	resolveUnifiedRole,
	SPECIAL_ROLE_MAPPINGS,
	UNIFIED_ROLES,
} from "./unified-roles";
