/**
 * Scope resolver — H02 Tenant Isolation Hardening
 *
 * Pure functions for resolving scopes from an AuthenticatedContext.
 * No infrastructure dependencies — testable in isolation.
 *
 * @module infrastructure/auth/scope-resolver
 */

import type {
	AuthenticatedContext,
	OrganizationMembership,
	TenantScope,
} from "@drenyra/domain/scope";
import { isActiveMembership } from "@drenyra/domain/scope";

/**
 * Find active membership by company ID, ignoring inactive/revoked/suspended.
 */
function findActiveMembership(
	memberships: OrganizationMembership[],
	companyId: string,
): OrganizationMembership | undefined {
	return memberships.find(
		(m) => m.companyId === companyId && isActiveMembership(m),
	);
}

/**
 * Find default active membership.
 */
function findDefaultActiveMembership(
	memberships: OrganizationMembership[],
): OrganizationMembership | undefined {
	return memberships.find((m) => m.isDefault && isActiveMembership(m));
}

/**
 * Resolve a TenantScope from an AuthenticatedContext and an optional requested company.
 *
 * The requested company ID comes from the client (header, param, etc.) and is treated
 * as a REQUEST, not authority. If the user does not have an active membership for that
 * company, an error is thrown.
 *
 * Solo memberships activas otorgan acceso. Revocadas, suspendidas o expiradas
 * son rechazadas incluso si existen en la DB.
 *
 * Si el usuario pertenece a varias organizaciones, la organización activa debe
 * determinarse por la sesión autenticada, no por "primera membership encontrada".
 *
 * @param ctx - Authenticated context with memberships.
 * @param requestedCompanyId - Optional company ID from the client request.
 * @returns TenantScope with validated organizationId and companyId.
 * @throws Error if the user does not have access to the requested company,
 *         or if the membership is inactive.
 */
export function resolveTenantScope(
	ctx: AuthenticatedContext,
	requestedCompanyId?: string,
): TenantScope {
	let membership: OrganizationMembership | undefined;

	if (requestedCompanyId) {
		membership = findActiveMembership(ctx.memberships, requestedCompanyId);

		if (!membership) {
			throw new Error(
				`User does not have access to company ${requestedCompanyId}`,
			);
		}
	} else {
		membership = findDefaultActiveMembership(ctx.memberships);

		if (!membership) {
			const activeCount = ctx.memberships.filter(isActiveMembership).length;

			if (activeCount === 1) {
				membership = ctx.memberships.find(isActiveMembership);
			} else if (activeCount > 1) {
				throw new Error("Multiple companies available. Please select one.");
			} else {
				throw new Error("User has no company access");
			}
		}
	}

	if (!membership) {
		throw new Error("Unexpected: membership could not be resolved");
	}

	return {
		organizationId: ctx.organizationId,
		companyId: membership.companyId,
	};
}
