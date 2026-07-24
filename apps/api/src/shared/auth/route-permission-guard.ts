/**
 * Route Permission Guard — Global Elysia Plugin
 *
 * Applies the route permission registry as a global onBeforeHandle.
 * Integrates with companyScopeGuard to read the user's role.
 *
 * @module route-permission-guard
 */

import { type Role, roleHasPermission } from "@drenyra/infrastructure/auth";
import type { Elysia } from "elysia";
import type { CompanyContext } from "../plugins/company-scope-guard";
import { matchRoute } from "./route-permissions";

/**
 * Global permission guard plugin.
 *
 * Checks every incoming request against the route permission map.
 * Public routes pass through. Protected routes require the user's
 * role to have the matching permission.
 *
 * Must be mounted AFTER companyScopeGuard so companyContext is available.
 *
 * @returns An Elysia plugin.
 *
 * @example
 * app
 *   .use(companyScopeGuard())
 *   .use(routePermissionGuard())
 *   .use(apiModules);
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

			// Check permissions
			const hasAny = route.permissions.some((perm) =>
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
		});
}
