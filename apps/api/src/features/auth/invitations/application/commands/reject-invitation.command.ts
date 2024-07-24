/**
 * Reject invitation handler.
 *
 * POST /api/invitations/:token/reject
 *
 * Authenticated user rejects a pending invitation. No membership created.
 * Lazy-expires expired invitations on first access.
 *
 * @module invitations/application/commands/reject-invitation.command
 */

import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { authInvitations } from "@drenyra/persistence/schema";
import { createLogger } from "../../../../../lib/logger";
import { fail, ok } from "../../../../shared/api-response";
import { resolveSessionIdentityFromHeaders } from "../../../handlers/session-identity";
import { isExpired, normalizeEmail } from "../../domain/invitation.entity";
import { INVITATION_ERROR_CODES } from "../../domain/invitation.errors";
import { findInvitationByToken, getUserEmail } from "../invitation-helpers";

const logger = createLogger({ feature: "auth", handler: "reject-invitation" });

// ============================================================
// Types
// ============================================================

interface RejectInvitationInput {
	token: string;
}

interface ElysiaContextLike {
	set: { status: number };
	headers: Record<string, string>;
}

// ============================================================
// Handler
// ============================================================

export async function rejectInvitation(
	input: RejectInvitationInput,
	ctx: ElysiaContextLike,
) {
	// 1. Authenticate
	const identity = await resolveSessionIdentityFromHeaders(ctx.headers);
	if (!identity.authUserId) {
		ctx.set.status = 401;
		return fail("Authentication required", "AUTH_REQUIRED");
	}

	const { token } = input;

	// 2. Find invitation
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

	// 4. Status check
	if (invitation.status === "accepted") {
		ctx.set.status = 409;
		return fail(
			"Invitation has already been accepted",
			INVITATION_ERROR_CODES.INVITATION_ALREADY_ACCEPTED,
		);
	}

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

	// 6. Reject
	await db
		.update(authInvitations)
		.set({ status: "rejected", updatedAt: new Date() })
		.where(eq(authInvitations.id, invitation.id));

	logger.info(
		{ invitationId: invitation.id, userId: identity.authUserId },
		"Invitation rejected",
	);

	return ok({
		invitation: {
			id: invitation.id,
			status: "rejected",
		},
	});
}
