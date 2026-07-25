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
	AuthenticatedContext,
	FiscalScope,
	FiscalScopeInput,
	MembershipRole,
	MembershipStatus,
	OrganizationMembership,
	OrganizationScope,
	Permission,
	TenantScope,
} from "./types";

export {
	ACTIVE_MEMBERSHIP_STATUSES,
	createFiscalScope,
	isActiveMembership,
	ROLE_PERMISSIONS,
} from "./types";
