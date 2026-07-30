import {
	WORKSPACE_PERMISSION,
	SENSITIVITY_LEVEL,
	type AuthorizedResource,
	type AuthorizationContext,
	type AuthorizationDecision,
	type WorkspacePermission,
} from "./types";

// ─── Authorization Policy ───────────────────────────────────────────────────

export interface AuthorizationPolicy {
	checkAccess(
		resource: AuthorizedResource,
		context: AuthorizationContext,
		requiredPermission: WorkspacePermission,
	): AuthorizationDecision;
}

export class DefaultAuthorizationPolicy implements AuthorizationPolicy {
	checkAccess(
		resource: AuthorizedResource,
		context: AuthorizationContext,
		requiredPermission: WorkspacePermission,
	): AuthorizationDecision {
		// Rule 3: Different org → no access
		if (resource.organizationId !== context.organizationId) {
			return {
				granted: false,
				permission: WORKSPACE_PERMISSION.NONE,
				reason: `Organization mismatch: resource belongs to '${resource.organizationId}', user is in '${context.organizationId}'`,
			};
		}

		const isAdmin = context.roles.includes("admin");
		const isOwner = resource.ownerId === context.userId;

		// Rule 5: Admin bypasses all sensitivity checks (still respects org)
		if (isAdmin) {
			// Admin can write/admin regardless of sensitivity
			if (requiredPermission === WORKSPACE_PERMISSION.ADMIN) {
				return {
					granted: true,
					permission: WORKSPACE_PERMISSION.ADMIN,
				};
			}
			return {
				granted: true,
				permission:
					requiredPermission === WORKSPACE_PERMISSION.READ
						? WORKSPACE_PERMISSION.READ
						: WORKSPACE_PERMISSION.WRITE,
			};
		}

		// Rule 4: "restricted" sensitivity → write requires admin regardless
		if (
			resource.sensitivity === SENSITIVITY_LEVEL.RESTRICTED &&
			requiredPermission === WORKSPACE_PERMISSION.WRITE
		) {
			return {
				granted: false,
				permission: WORKSPACE_PERMISSION.READ,
				reason: `Resource '${resource.resourceId}' is restricted — admin role required for write access`,
			};
		}

		// Rule 1: Same org + same user → full access (write based on ownership)
		if (isOwner) {
			if (requiredPermission === WORKSPACE_PERMISSION.ADMIN) {
				return {
					granted: false,
					permission: WORKSPACE_PERMISSION.WRITE,
					reason: "Owner has write access but lacks admin role",
				};
			}
			return {
				granted: true,
				permission: requiredPermission,
			};
		}

		// Rule 2: Different user, same org → read-only
		if (requiredPermission === WORKSPACE_PERMISSION.READ) {
			return {
				granted: true,
				permission: WORKSPACE_PERMISSION.READ,
			};
		}

		return {
			granted: false,
			permission: WORKSPACE_PERMISSION.READ,
			reason: `User '${context.userId}' is not the owner of resource '${resource.resourceId}' and lacks admin role`,
		};
	}
}
