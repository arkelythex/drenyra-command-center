/**
 * Company Scope Guard — Elysia Plugin
 *
 * Wraps `resolveSessionContext()` from the security module and injects
 * `companyContext: CompanyContext` into the request store via Elysia's
 * `derive`.
 *
 * ## Usage
 *
 * ```ts
 * import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
 *
 * new Elysia({ prefix: "/api/analytics" })
 *   .use(companyScopeGuard())
 *   .get("/", ({ companyContext }) => {
 *     // companyContext.companyId is available
 *   });
 * ```
 *
 * ## Migration
 *
 * During Phase 3 migration, pass `allowHeaderFallback: true` for backward
 * compatibility with features still using `requireCompanyIdFromHeaders`:
 *
 * ```ts
 * .use(companyScopeGuard({ allowHeaderFallback: true }))
 * ```
 *
 * Phase 4 will remove the fallback and mandate session-only context.
 *
 * @module company-scope-guard
 */

import type { Elysia } from "elysia";
import { resolveSessionContext } from "../../features/security/session-context";

/**
 * Company-scoped context injected into Elysia's store by the guard.
 *
 * Subset of `SessionContext` — only the fields relevant for tenant scoping.
 */
export interface CompanyContext {
	/** Canonical user identifier (Better Auth) */
	userId: string;
	/** Authenticated user identifier (alias for userId) */
	authUserId: string;
	/** Legacy user identifier (pre-Better Auth) */
	legacyUserId: string | null;
	/** User role for RBAC decisions */
	role: string;
	/** Tenant (company) identifier — used for all query scoping */
	companyId: string;
}

/**
 * Options for configuring the company scope guard plugin.
 */
export interface CompanyScopeGuardOptions {
	/**
	 * If `true`, allows header-based company resolution as a fallback when
	 * an active Better Auth session is not present.
	 *
	 * Default: `false`
	 *
	 * Use `true` during Phase 3 migration for backward compatibility.
	 * Phase 4 will require session-only context.
	 */
	allowHeaderFallback?: boolean;
}

/**
 * Reusable Elysia plugin that resolves company context from the request
 * and injects it into the Elysia store as `companyContext`.
 *
 * Fail-closed: if session context cannot be resolved, the request is
 * rejected with the appropriate error status (401 or 403).
 *
 * @param options - Configuration options for the guard.
 * @returns An Elysia plugin compatible with `.use()`.
 *
 * @example
 * // Apply at module level — all routes inherit company scoping
 * export const myModule = new Elysia({ prefix: "/api/my-feature" })
 *   .use(companyScopeGuard())
 *   .get("/", ({ companyContext }) => {
 *     // companyContext.companyId is always available here
 *   });
 *
 * @example
 * // With header fallback during migration
 * .use(companyScopeGuard({ allowHeaderFallback: true }))
 */
export function companyScopeGuard(options: CompanyScopeGuardOptions = {}) {
	const { allowHeaderFallback = false } = options;

	return (app: Elysia) =>
		app.derive(async ({ headers, set }) => {
			/**
			 * During Phase 3 migration (allowHeaderFallback: true), do not
			 * require a full session — the guard will first attempt session
			 * resolution and fall back to header-based identity.
			 *
			 * When allowHeaderFallback: false (Phase 4+), session is required.
			 *
			 * Note: resolveSessionContext internally forces allowHeaderFallback
			 * to false when requireSession is true, so we MUST pass
			 * requireSession=false when using the fallback.
			 */
			const requireSession = !allowHeaderFallback;

			try {
				const result = await resolveSessionContext({
					headers: headers as Record<string, unknown>,
					requireSession,
					allowHeaderFallback,
				});

				if (!result.ok) {
					/**
					 * During migration (allowHeaderFallback: true), we log the
					 * rejection but do NOT fail-closed — this preserves backward
					 * compatibility for features that want to handle their own
					 * company scoping while the guard is being adopted.
					 *
					 * In Phase 4 (allowHeaderFallback: false), we fail closed.
					 */
					if (allowHeaderFallback) {
						// Pass through — no company context available.
						// The handler can still use its existing scoping mechanism.
						return { companyContext: undefined as unknown as CompanyContext };
					}

					set.status = result.status;
					throw new Error(result.error);
				}

				return {
					companyContext: {
						userId: result.context.userId,
						authUserId: result.context.authUserId,
						legacyUserId: result.context.legacyUserId,
						role: result.context.role,
						companyId: result.context.companyId,
					},
				};
			} catch (error) {
				/**
				 * If resolveSessionContext throws (e.g. DB is unavailable in
				 * test environments or session validation fails unexpectedly),
				 * behave according to the fallback mode.
				 *
				 * With allowHeaderFallback: true, gracefully degrade — the
				 * handler can continue with its existing scoping mechanism.
				 *
				 * With allowHeaderFallback: false, re-throw to fail closed.
				 */
				if (allowHeaderFallback) {
					return { companyContext: undefined as unknown as CompanyContext };
				}
				throw error;
			}
		});
}
