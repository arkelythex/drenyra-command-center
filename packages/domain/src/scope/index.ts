/**
 * Canonical scope types for multi-tenant Drenyra operations.
 *
 * Three levels:
 * - OrganizationScope:  organizationId only
 * - TenantScope:        organizationId + companyId
 * - FiscalScope:        organizationId + companyId + companyRuc + period + countryCode
 *
 * Also exports AuthenticatedContext, OrganizationMembership, and role/permission types.
 *
 * @module @drenyra/domain/scope
 */

export type {
	OrganizationScope,
	TenantScope,
	FiscalScope,
	FiscalScopeInput,
	AuthenticatedContext,
	OrganizationMembership,
	MembershipRole,
	MembershipStatus,
	Permission,
} from "./types";

export {
	ROLE_PERMISSIONS,
	ACTIVE_MEMBERSHIP_STATUSES,
	isActiveMembership,
	createFiscalScope,
} from "./types";
