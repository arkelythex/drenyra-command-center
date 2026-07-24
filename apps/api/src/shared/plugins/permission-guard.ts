/**
 * Permission Guard — Elysia Plugin
 *
 * Verifies that the authenticated user has a specific permission before
 * allowing the request to proceed. Integrates with `companyScopeGuard`
 * to read the user's role from `companyContext`.
 *
 * ## Usage
 *
 * ```ts
 * import { requirePermission } from "../../shared/plugins/permission-guard";
 * import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
 *
 * new Elysia({ prefix: "/api/journals" })
 *   .use(companyScopeGuard())
 *   .use(requirePermission("journal:create"))
 *   .post("/", createJournalHandler);
 * ```
 *
 * @module permission-guard
 */

import {
	type Permission,
	type Role,
	roleHasPermission,
} from "@drenyra/infrastructure/auth";
import type { Elysia } from "elysia";
import type { CompanyContext } from "./company-scope-guard";

/**
 * Permission guard — applies a `roleHasPermission` check using the user's
 * role from `companyContext` (injected by `companyScopeGuard`).
 *
 * @param permission - The permission(s) to check. If multiple, ANY match grants access.
 * @returns An Elysia plugin that fails with 401/403 if the check fails.
 *
 * @example
 * .use(requirePermission("journal:create"))
 * .use(requirePermission(["journal:read", "reports:read_operational"]))
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

			const hasAny = permissions.some((perm) =>
				roleHasPermission(ctx.role as Role, perm),
			);

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
 *
 * @example
 * new Elysia({ prefix: "/api/journals" })
 *   .use(scopedPermission("journal:create"))
 *   .post("/", createJournalHandler);
 */
export function scopedPermission(
	permission: Permission | Permission[],
	scopeOptions?: { allowHeaderFallback?: boolean },
) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { companyScopeGuard } = require("./company-scope-guard");

	return (app: Elysia) =>
		app.use(companyScopeGuard(scopeOptions)).use(requirePermission(permission));
}
