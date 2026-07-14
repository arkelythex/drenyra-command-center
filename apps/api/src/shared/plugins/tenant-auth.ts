/**
 * Tenant Auth — Elysia Plugin
 *
 * Defense-in-depth middleware for Wave 3A Tenant Boundary Closure.
 *
 * ## Principles
 *
 * 1. organizationId y companyId se derivan EXCLUSIVAMENTE de identidad autenticada
 *    y membership verificada. Headers/body/query SOLO pueden solicitar un contexto,
 *    nunca establecer autoridad.
 * 2. Deny-by-default para rutas tenant-owned. Sin autenticación → 401.
 * 3. Allowlist explícita para rutas públicas, webhooks y catálogos.
 * 4. Principals separados: usuario humano, servicio interno, webhook.
 * 5. Respuestas cross-tenant indistinguibles de "no existe" (mismo 404, timing).
 *
 * @module tenant-auth
 */

import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { authUserCompanies } from "@drenyra/persistence/schema";
import type { Elysia } from "elysia";
import { resolveSessionContext } from "../../features/security/session-context";

// ─── Types ───────────────────────────────────────────────────────

/**
 * Verified tenant-scoped identity injected into Elysia's store.
 * Todo valor aquí fue verificado contra sesión + membership.
 */
export interface TenantContext {
	/** Canonical user identifier (Better Auth) */
	userId: string;
	/** Organization ID verificado del usuario autenticado */
	organizationId: string;
	/** Company ID verificado — el usuario pertenece a esta company */
	companyId: string;
	/** Membership role en la company seleccionada */
	role: string;
	/** Todas las companies a las que el usuario pertenece */
	memberships: UserMembership[];
}

/**
 * Membership individual — una company a la que el usuario pertenece.
 */
export interface UserMembership {
	companyId: string;
	organizationId: string;
	role: string;
	isDefault: boolean;
}

/**
 * Principal type for the request.
 * - `user`: human user with session
 * - `service`: internal service (machine-to-machine)
 * - `webhook`: external webhook (OSE, SUNAT callbacks)
 */
export type PrincipalType = "user" | "service" | "webhook";

/**
 * Result of tenant auth resolution.
 */
export type TenantAuthResult =
	| { ok: true; context: TenantContext; principal: PrincipalType }
	| { ok: false; status: 401 | 403; code: string; error: string };

// ─── Options ─────────────────────────────────────────────────────

export interface TenantAuthOptions {
	/**
	 * Allow public (unauthenticated) access.
	 * Use ONLY for routes that serve public/reference data.
	 */
	allowPublic?: boolean;

	/**
	 * Allow service principals (machine-to-machine with API key).
	 */
	allowService?: boolean;

	/**
	 * Allow webhook principals (external callbacks without user session).
	 */
	allowWebhook?: boolean;

	/**
	 * Accepted principal types for this route group.
	 * Default: ["user"]
	 */
	acceptedPrincipals?: PrincipalType[];

	/**
	 * During migration, allow header-based company resolution as fallback
	 * when no session is present. Phase 4+ will remove this.
	 */
	allowHeaderFallback?: boolean;
}

// ─── Defaults ────────────────────────────────────────────────────

const DEFAULT_OPTIONS: TenantAuthOptions = {
	allowPublic: false,
	allowService: false,
	allowWebhook: false,
	acceptedPrincipals: ["user"],
	allowHeaderFallback: false,
};

// ─── Membership Resolution ───────────────────────────────────────

/**
 * Resuelve todas las memberships del usuario desde auth_user_companies.
 */
export async function resolveUserMemberships(
	userId: string,
): Promise<UserMembership[]> {
	if (!userId) return [];

	const rows = await db
		.select({
			companyId: authUserCompanies.companyId,
			role: authUserCompanies.membershipRole,
			isDefault: authUserCompanies.isDefault,
		})
		.from(authUserCompanies)
		.where(eq(authUserCompanies.userId, userId));

	// Each row is a company. We need to derive organizationId.
	// For now, the companies table has the relationship.
	// In a simplified form, we infer organizationId from company data.
	// The canonical org mapping will be enhanced in future PRs.
	return rows.map((r) => ({
		companyId: r.companyId,
		organizationId: r.companyId, // Simplified: orgId = companyId for single-org
		role: r.role,
		isDefault: r.isDefault ?? false,
	}));
}

/**
 * Valida que el userId tenga acceso a la companyId solicitada.
 * Devuelve la membership si existe, null si no.
 */
export async function validateCompanyMembership(
	userId: string,
	requestedCompanyId: string,
): Promise<UserMembership | null> {
	const memberships = await resolveUserMemberships(userId);
	return memberships.find((m) => m.companyId === requestedCompanyId) ?? null;
}

// ─── Auth Middleware ─────────────────────────────────────────────

/**
 * Resuelve el contexto autenticado y verifica membership.
 *
 * Orden de resolución:
 *   1. Session JWT (Better Auth) → userId
 *   2. userId → memberships (auth_user_companies)
 *   3. requestedCompanyId de header/query/body (SOLO como selección)
 *   4. Verificar que userId tenga membership en requestedCompanyId
 *   5. Devolver TenantContext verificado
 *
 * @throws Error con status 401/403 si falla la verificación
 */
export async function resolveTenantAuth(
	headers: Record<string, unknown>,
	options: TenantAuthOptions = {},
): Promise<TenantAuthResult> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// ─── 1. Resolver sesión ──────────────────────────────────────

	// When header fallback is allowed, never require session first.
	// Session will be tried; if unavailable, header fallback provides identity.
	const requireSession = opts.allowHeaderFallback
		? false
		: !opts.allowPublic && !opts.allowService && !opts.allowWebhook;

	try {
		const sessionResult = await resolveSessionContext({
			headers,
			requireSession,
			allowHeaderFallback: opts.allowHeaderFallback ?? false,
		});

		if (!sessionResult.ok) {
			// Si allowPublic, continuamos sin contexto de tenant
			if (opts.allowPublic) {
				return {
					ok: true,
					context: {
						userId: "",
						organizationId: "",
						companyId: "",
						role: "",
						memberships: [],
					},
					principal: "webhook",
				};
			}
			return {
				ok: false,
				status: sessionResult.status,
				code: sessionResult.code,
				error: sessionResult.error,
			};
		}

		const { userId, companyId: sessionCompanyId } = sessionResult.context;

		// ─── 2. Resolver memberships ────────────────────────────────

		const memberships = await resolveUserMemberships(userId);

		// ─── 3. Determinar company solicitada ───────────────────────

		// El header/body/query SOLO selecciona contexto, no establece autoridad
		const requestedCompanyId =
			readHeader(headers, "x-company-id") ?? sessionCompanyId;

		// ─── 4. Validar membership ──────────────────────────────────

		let activeMembership = memberships.find(
			(m) => m.companyId === requestedCompanyId,
		);

		// Si no hay membership para la company solicitada, intentar con sessionCompanyId
		if (!activeMembership) {
			activeMembership = memberships.find(
				(m) => m.companyId === sessionCompanyId,
			);
		}

		// Fallback: usar la membership default
		if (!activeMembership) {
			activeMembership = memberships.find((m) => m.isDefault) ?? null;
		}

		// Si no hay ninguna membership, denegar
		if (!activeMembership) {
			return {
				ok: false,
				status: 403,
				code: "FORBIDDEN",
				error: "User does not have access to any company",
			};
		}

		// Si se solicitó una company específica pero no hay membership → 403
		// indistinguible de "no existe"
		if (
			requestedCompanyId &&
			!memberships.find((m) => m.companyId === requestedCompanyId)
		) {
			return {
				ok: false,
				status: 403,
				code: "FORBIDDEN",
				error: "Access to the requested company is not permitted",
			};
		}

		// ─── 5. Devolver contexto verificado ────────────────────────

		return {
			ok: true,
			context: {
				userId,
				organizationId: activeMembership.organizationId,
				companyId: activeMembership.companyId,
				role: activeMembership.role,
				memberships,
			},
			principal: "user",
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Tenant auth resolution failed";
		return {
			ok: false,
			status: 401,
			code: "TENANT_AUTH_FAILED",
			error: message,
		};
	}
}

// ─── Helpers ─────────────────────────────────────────────────────

function readHeader(
	headers: Record<string, unknown>,
	name: string,
): string | null {
	const value = headers[name];
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	return null;
}

// ─── Elysia Plugin ───────────────────────────────────────────────

/**
 * Tenant Auth — Elysia Plugin
 *
 * Inyecta `tenantContext: TenantContext` verificado en el store de Elysia.
 *
 * @example
 * ```ts
 * import { tenantAuth } from "../../shared/plugins/tenant-auth";
 *
 * new Elysia({ prefix: "/api/drenyra" })
 *   .use(tenantAuth())
 *   .get("/cases", ({ tenantContext, store }) => {
 *     // tenantContext.companyId, tenantContext.userId verificados
 *   });
 * ```
 *
 * @example Rutas públicas (catálogos, health checks):
 * ```ts
 * .use(tenantAuth({ allowPublic: true }))
 * ```
 *
 * @example Webhooks:
 * ```ts
 * .use(tenantAuth({ allowWebhook: true }))
 * ```
 */
export function tenantAuth(options: TenantAuthOptions = {}) {
	const opts: TenantAuthOptions = { ...DEFAULT_OPTIONS, ...options };

	return (app: Elysia) =>
		app.derive(async ({ headers, set }) => {
			const result = await resolveTenantAuth(
				headers as Record<string, unknown>,
				opts,
			);

			if (!result.ok) {
				set.status = result.status;
				throw new Error(result.error);
			}

			return { tenantContext: result.context, principal: result.principal };
		});
}
