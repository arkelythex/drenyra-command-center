/**
 * Accept invitation handler.
 *
 * POST /api/invitations/:token/accept
 *
 * Token-based acceptance: authenticated user accepts an invitation.
 * Creates authUserCompanies membership row.
 * Anti-enumeration: same error shape for invalid/expired/rejected/accepted tokens.
 *
 * @module invitations/application/commands/accept-invitation.command
 */

import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { authInvitations, authUserCompanies } from "@drenyra/persistence/schema";
import type { MembershipRole } from "@drenyra/domain/scope";
import { createLogger } from "../../../../../lib/logger";
import { fail, ok } from "../../../../shared/api-response";
import { resolveSessionIdentityFromHeaders } from "../../../handlers/session-identity";
import { isExpired, normalizeEmail } from "../../domain/invitation.entity";
import { INVITATION_ERROR_CODES } from "../../domain/invitation.errors";
import { findInvitationByToken, getUserEmail, isExistingMember } from "../invitation-helpers";

const logger = createLogger({ feature: "auth", handler: "accept-invitation" });

// ============================================================
// Types
// ============================================================

interface AcceptInvitationInput {
	token: string;
}

interface ElysiaContextLike {
	set: { status: number };
	headers: Record<string, string>;
}

// ============================================================
// Handler
// ============================================================

export async function acceptInvitation(
	input: AcceptInvitationInput,
	ctx: ElysiaContextLike,
) {
	// 1. Authenticate
	const identity = await resolveSessionIdentityFromHeaders(ctx.headers);
	if (!identity.authUserId) {
		ctx.set.status = 401;
		return fail("Authentication required", "AUTH_REQUIRED");
	}

	const { token } = input;

	// 2. Find invitation by token
	const invitation = await findInvitationByToken(token);
	if (!invitation) {
		ctx.set.status = 404;
		return fail(
			"Invitation not found or no longer valid",
			INVITATION_ERROR_CODES.INVITATION_NOT_FOUND,
		);
	}

	// 3. Lazy-expire
	if (invitation.status === "pending" && isExpired(invitation.expiresAt)) {
		await db
			.update(authInvitations)
			.set({ status: "expired", updatedAt: new Date() })
			.where(eq(authInvitations.id, invitation.id));
		ctx.set.status = 404;
		return fail(
			"Invitation not found or no longer valid",
			INVITATION_ERROR_CODES.INVITATION_NOT_FOUND,
		);
	}

	// 4. Unified error for non-pending states
	if (invitation.status !== "pending") {
		ctx.set.status = 404;
		return fail(
			"Invitation not found or no longer valid",
			INVITATION_ERROR_CODES.INVITATION_NOT_FOUND,
		);
	}

	// 5. Email match
	const userEmail = await getUserEmail(identity.authUserId);
	if (
		!userEmail ||
		normalizeEmail(userEmail) !== normalizeEmail(invitation.inviteeEmail)
	) {
		ctx.set.status = 403;
		return fail("Email does not match invitation", INVITATION_ERROR_CODES.EMAIL_MISMATCH);
	}

	// 6. Belt-and-suspenders: check not already member
	const alreadyMember = await isExistingMember(
		identity.authUserId,
		invitation.companyId,
	);
	if (alreadyMember) {
		ctx.set.status = 409;
		return fail(
			"User is already a member of this company",
			INVITATION_ERROR_CODES.ALREADY_MEMBER,
		);
	}

	// 7. Create membership + update invitation
	const now = new Date();
	const membershipId = `${identity.authUserId}:${invitation.companyId}`;

	await db
		.insert(authUserCompanies)
		.values({
			id: membershipId,
			userId: identity.authUserId,
			companyId: invitation.companyId,
			membershipRole: invitation.role as MembershipRole,
			isDefault: false,
			membershipStatus: "active",
		})
		.onConflictDoNothing();

	await db
		.update(authInvitations)
		.set({ status: "accepted", updatedAt: now })
		.where(eq(authInvitations.id, invitation.id));

	logger.info(
		{
			invitationId: invitation.id,
			userId: identity.authUserId,
			companyId: invitation.companyId,
		},
		"Invitation accepted",
	);

	return ok({
		membership: {
			userId: identity.authUserId,
			companyId: invitation.companyId,
			membershipRole: invitation.role,
			membershipStatus: "active",
			isDefault: false,
		},
	});
}
