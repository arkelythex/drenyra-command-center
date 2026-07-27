/**
 * Permission Guard — Elysia Plugin
 *
 * Verifies that the authenticated user has a specific permission before
 * allowing the request to proceed. Integrates with `companyScopeGuard`
 * to read the user's role from `companyContext`.
 *
 * @module permission-guard
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
import type { CompanyContext } from "./company-scope-guard";

/**
 * Maps a legacy Permission to its `business:`-prefixed counterpart.
 */
function toBusinessPermission(perm: Permission): BusinessPermission {
	return `business:${perm}` as BusinessPermission;
}

/**
 * Permission guard — applies a permission check using the user's
 * role from `companyContext` (injected by `companyScopeGuard`).
 *
 * When `UNIFIED_RBAC_ENABLED` is true, delegates to the unified guard.
 * Otherwise uses the legacy `roleHasPermission`.
 *
 * @param permission - The permission(s) to check. If multiple, ANY match grants access.
 */
export function requirePermission(permission: Permission | Permission[]) {
	const permissions = Array.isArray(permission) ? permission : [permission];

	return (app: Elysia) =>
		app.onBeforeHandle(({ set, ...rest }) => {
			const ctx = (rest as Record<string, unknown>).companyContext as
				| CompanyContext
				| undefined;

			if (!ctx) {
				set.status = 401;
				return {
					success: false,
					error: "Se requiere autenticación",
					code: "SESSION_REQUIRED",
				} as const;
			}

			const hasAny: boolean = RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED
				? permissions.some((perm) =>
						hasBusinessPermission(ctx.role as Role, toBusinessPermission(perm)),
					)
				: permissions.some((perm) => roleHasPermission(ctx.role as Role, perm));

			if (!hasAny) {
				set.status = 403;
				return {
					success: false,
					error: `Permiso denegado: se requiere uno de [${permissions.join(", ")}]`,
					code: "FORBIDDEN",
					requiredPermissions: permissions,
					userRole: ctx.role,
				} as const;
			}

			return;
		});
}

/**
 * Convenience guard that combines companyScopeGuard + requirePermission
 * in a single `.use()` call.
 */
export function scopedPermission(
	permission: Permission | Permission[],
	scopeOptions?: { allowHeaderFallback?: boolean },
) {
	const { companyScopeGuard } = require("./company-scope-guard") as {
		companyScopeGuard: (opts?: { allowHeaderFallback?: boolean }) => Elysia;
	};

	return (app: Elysia) =>
		app.use(companyScopeGuard(scopeOptions)).use(requirePermission(permission));
}
