/**
 * Route Permission Guard — Global Elysia Plugin
 *
 * Applies the route permission registry as a global onBeforeHandle.
 * Integrates with companyScopeGuard to read the user's role.
 *
 * When `UNIFIED_RBAC_ENABLED` is true, delegates to the unified guard.
 *
 * @module route-permission-guard
 */

import {
	type Permission,
	type Role,
	roleHasPermission,
} from "@drenyra/infrastructure/auth";
import {
	hasBusinessPermission,
	RBAC_FEATURE_FLAGS,
	type BusinessPermission,
} from "@drenyra/security/rbac";
import type { Elysia } from "elysia";
import type { CompanyContext } from "../plugins/company-scope-guard";
import { matchRoute } from "./route-permissions";

/**
 * Maps a legacy Permission to its `business:`-prefixed counterpart.
 */
function toBusinessPermission(perm: Permission): BusinessPermission {
	return `business:${perm}` as BusinessPermission;
}

/**
 * Global permission guard plugin.
 *
 * Checks every incoming request against the route permission map.
 * Public routes pass through. Protected routes require the user's
 * role to have the matching permission.
 *
 * Must be mounted AFTER companyScopeGuard so companyContext is available.
 */
export function routePermissionGuard() {
	return (app: Elysia) =>
		app.onBeforeHandle(({ request, set, ...rest }) => {
			const ctx = (rest as Record<string, unknown>).companyContext as
				| CompanyContext
				| undefined;

			const route = matchRoute(request.url, request.method);

			// No route match — allow (non-API routes)
			if (!route) return;

			// Public route — allow
			if (route.isPublic) return;

			// No companyContext — reject
			if (!ctx) {
				set.status = 401;
				return {
					success: false,
					error: "Se requiere autenticación",
					code: "SESSION_REQUIRED",
				} as const;
			}

			// Check permissions (unified or legacy based on feature flag)
			const hasAny = RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED
				? route.permissions.some((perm) =>
						hasBusinessPermission(ctx.role as Role, toBusinessPermission(perm)),
					)
				: route.permissions.some((perm) =>
						roleHasPermission(ctx.role as Role, perm),
					);

			if (!hasAny) {
				set.status = 403;
				return {
					success: false,
					error: `Permiso denegado: se requiere uno de [${route.permissions.join(", ")}]`,
					code: "FORBIDDEN",
					requiredPermissions: route.permissions,
					userRole: ctx.role,
				} as const;
			}

			return;
		});
}
