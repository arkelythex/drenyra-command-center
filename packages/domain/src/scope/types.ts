/**
 * Scope types for multi-tenant fiscal operations.
 *
 * Three levels of scope provide progressive granularity:
 * - OrganizationScope:    Identifies the organization (tenant root)
 * - TenantScope:          Organization + Company (operational entities)
 * - FiscalScope:          TenantScope + period + country (fiscal operations)
 *
 * @module domain/scope
 */

/**
 * Organization-level scope.
 * Suficiente para entidades que pertenecen a la organización pero no a una empresa específica.
 *
 * @example
 * ```ts
 * const scope: OrganizationScope = { organizationId: "org-001" };
 * ```
 */
export interface OrganizationScope {
	/** Stable organization identifier. Siempre obligatorio. */
	organizationId: string;
}

/**
 * Tenant-level scope — identifica una company dentro de una organización.
 * Necesario para toda entidad tenant-owned (documentos, cuentas, asientos, evidencia).
 *
 * @example
 * ```ts
 * const scope: TenantScope = {
 *   organizationId: "org-001",
 *   companyId: "company-001",
 * };
 * ```
 */
export interface TenantScope {
	/** Stable organization identifier. Nunca opcional. */
	organizationId: string;
	/** Company (RUC-level entity) within the organization. */
	companyId: string;
}

/**
 * Fiscal scope — extiende TenantScope con período fiscal y país.
 *
 * NO debe construirse con object literal directo. Usar `createFiscalScope()`
 * para garantizar consistencia entre companyRuc, countryCode y la company validada.
 *
 * @example
 * ```ts
 * const scope = createFiscalScope(validatedCompany, "2026-07");
 * ```
 */
export interface FiscalScope {
	/** Stable organization identifier. Siempre obligatorio. */
	organizationId: string;
	/** Company (RUC-level entity) within the organization. */
	companyId: string;
	/** RUC de la empresa para el período fiscal. */
	companyRuc: string;
	/** Período fiscal en formato YYYY-MM. */
	period: string;
	/** Código de país ISO 3166-1 alpha-2. */
	countryCode: string;
}

/**
 * Input mínimo requerido para construir un FiscalScope validado.
 * Típicamente resuelto desde la DB (entidad Company + período validado).
 */
export interface FiscalScopeInput {
	company: {
		id: string;
		organizationId: string;
		ruc: string;
		countryCode: string;
	};
	period: string;
}

/**
 * Crea un FiscalScope validado a partir de una entidad Company y un período.
 *
 * Garantiza que:
 * - organizationId viene de la Company, no de input arbitrario
 * - companyRuc viene de la Company, no de metadata desactualizada
 * - countryCode viene de la Company, no de un header no validado
 *
 * @throws Error si el input es inválido.
 */
export function createFiscalScope(input: FiscalScopeInput): FiscalScope {
	if (!input.company.id || !input.company.organizationId) {
		throw new Error("Company must have id and organizationId");
	}
	if (input.company.ruc?.length !== 11) {
		throw new Error("Company must have a valid 11-digit RUC");
	}
	if (!input.period || !/^\d{4}-\d{2}$/.test(input.period)) {
		throw new Error("Period must be in YYYY-MM format");
	}

	return {
		organizationId: input.company.organizationId,
		companyId: input.company.id,
		companyRuc: input.company.ruc,
		period: input.period,
		countryCode: input.company.countryCode,
	};
}

/**
 * Contexto autenticado completo con memberships verificadas.
 * Construido únicamente por `requireAuthContext()` en infrastructure,
 * nunca a partir de datos del cliente.
 */
export interface AuthenticatedContext {
	/** Stable user identifier. */
	userId: string;
	/** Organization a la que pertenece el usuario. Siempre de la session, no del body. */
	organizationId: string;
	/** Memberships verificadas del usuario a companies. */
	memberships: OrganizationMembership[];
}

/**
 * Membership verificada de un usuario a una company dentro de una organización.
 */
export interface OrganizationMembership {
	/** Organization ID (coincide con AuthenticatedContext.organizationId). */
	organizationId: string;
	/** Company ID a la que tiene acceso. */
	companyId: string;
	/** RUC de la company. */
	companyRuc: string;
	/** Rol del usuario en esta company. */
	role: MembershipRole;
	/** Si es la company por defecto del usuario. */
	isDefault: boolean;
	/** Estado de la membership. Solo 'active' permite acceso. */
	status: MembershipStatus;
	/** Permisos concretos derivados del rol. */
	permissions: Permission[];
}

/**
 * Estados de una membership.
 */
export type MembershipStatus = "active" | "suspended" | "revoked" | "expired";

/**
 * Filtros de estado activo para memberships.
 */
export const ACTIVE_MEMBERSHIP_STATUSES: MembershipStatus[] = ["active"];

/**
 * Valida que una membership esté activa.
 * Las memberships revocadas, suspendidas o expiradas no otorgan acceso.
 */
export function isActiveMembership(
	membership: OrganizationMembership,
): boolean {
	return ACTIVE_MEMBERSHIP_STATUSES.includes(membership.status);
}

/**
 * Roles de usuario dentro de una company.
 */
export type MembershipRole =
	| "OWNER"
	| "ADMIN"
	| "ACCOUNTANT"
	| "REVIEWER"
	| "APPROVER"
	| "VIEWER";

/**
 * Permisos concretos por operación.
 */
export type Permission =
	| "journal:read"
	| "journal:create"
	| "journal:update"
	| "journal:delete"
	| "document:read"
	| "document:upload"
	| "evidence:read"
	| "evidence:download"
	| "finding:read"
	| "finding:resolve"
	| "approval:request"
	| "approval:decide"
	| "sire:submit"
	| "report:generate"
	| "audit:read"
	| "company:read"
	| "company:update"
	| "settings:read"
	| "settings:update"
	| "user:invite";

/**
 * Mapeo de rol → permisos por defecto.
 */
export const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]> = {
	OWNER: [
		"journal:read",
		"journal:create",
		"journal:update",
		"journal:delete",
		"document:read",
		"document:upload",
		"evidence:read",
		"evidence:download",
		"finding:read",
		"finding:resolve",
		"approval:request",
		"approval:decide",
		"sire:submit",
		"report:generate",
		"audit:read",
		"company:read",
		"company:update",
		"settings:read",
		"settings:update",
		"user:invite",
	],
	ADMIN: [
		"journal:read",
		"journal:create",
		"journal:update",
		"journal:delete",
		"document:read",
		"document:upload",
		"evidence:read",
		"evidence:download",
		"finding:read",
		"finding:resolve",
		"approval:request",
		"approval:decide",
		"sire:submit",
		"report:generate",
		"audit:read",
		"company:read",
		"company:update",
		"settings:read",
		"settings:update",
		"user:invite",
	],
	ACCOUNTANT: [
		"journal:read",
		"journal:create",
		"journal:update",
		"journal:delete",
		"document:read",
		"document:upload",
		"evidence:read",
		"evidence:download",
		"finding:read",
		"finding:resolve",
		"approval:request",
		"sire:submit",
		"report:generate",
		"company:read",
		"settings:read",
	],
	REVIEWER: [
		"journal:read",
		"document:read",
		"evidence:read",
		"evidence:download",
		"finding:read",
		"report:generate",
		"company:read",
	],
	APPROVER: [
		"document:read",
		"evidence:read",
		"evidence:download",
		"approval:decide",
		"company:read",
	],
	VIEWER: [
		"document:read",
		"evidence:read",
		"evidence:download",
		"company:read",
	],
};
