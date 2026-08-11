/**
 * Shared invitation helpers.
 *
 * Common DB queries and permission checks used across invitation handlers.
 *
 * @module invitations/application/invitation-helpers
 */

import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import {
	authInvitations,
	authUserCompanies,
	authUsers,
} from "@drenyra/persistence/schema";
import type { MembershipRole, Permission } from "@drenyra/domain/scope";
import { ROLE_PERMISSIONS } from "@drenyra/domain/scope";

/**
 * Check if a user has user:invite permission in a company.
 */
export async function hasInvitePermission(
	userId: string,
	companyId: string,
): Promise<boolean> {
	const rows = await db
		.select({ membershipRole: authUserCompanies.membershipRole })
		.from(authUserCompanies)
		.where(
			and(
				eq(authUserCompanies.userId, userId),
				eq(authUserCompanies.companyId, companyId),
				eq(authUserCompanies.membershipStatus, "active"),
			),
		)
		.limit(1);

	if (rows.length === 0) return false;

	const first = rows[0];
	if (!first) return false;

	const role = first.membershipRole as MembershipRole;
	return (
		(ROLE_PERMISSIONS[role] as Permission[] | undefined)?.includes("user:invite") ??
		false
	);
}

/**
 * Find an invitation by its token.
 */
export async function findInvitationByToken(
	token: string,
) {
	const rows = await db
		.select()
		.from(authInvitations)
		.where(eq(authInvitations.token, token))
		.limit(1);
	return rows[0] ?? null;
}

/**
 * Get the email for a user by their ID.
 */
export async function getUserEmail(
	userId: string,
): Promise<string | null> {
	const rows = await db
		.select({ email: authUsers.email })
		.from(authUsers)
		.where(eq(authUsers.id, userId))
		.limit(1);
	return rows[0]?.email ?? null;
}

/**
 * Check if a user is an active member of a company.
 */
export async function isExistingMember(
	userId: string,
	companyId: string,
): Promise<boolean> {
	const rows = await db
		.select({ id: authUserCompanies.id })
		.from(authUserCompanies)
		.where(
			and(
				eq(authUserCompanies.userId, userId),
				eq(authUserCompanies.companyId, companyId),
				eq(authUserCompanies.membershipStatus, "active"),
			),
		)
		.limit(1);
	return rows.length > 0;
}
