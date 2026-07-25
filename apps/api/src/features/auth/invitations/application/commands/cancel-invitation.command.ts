/**
 * Cancel invitation handler.
 *
 * DELETE /api/companies/:companyId/invitations/:id
 *
 * Only users with user:invite permission can cancel invitations.
 * Only pending invitations can be cancelled — sets status to "cancelled".
 * Cross-company access returns 404 (do not leak existence).
 *
 * @module invitations/application/commands/cancel-invitation.command
 */

import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { authInvitations } from "@drenyra/persistence/schema";
import { createLogger } from "../../../../../lib/logger";
import { fail, ok } from "../../../../shared/api-response";
import { resolveSessionIdentityFromHeaders } from "../../../handlers/session-identity";
import { INVITATION_ERROR_CODES } from "../../domain/invitation.errors";
import { hasInvitePermission } from "../invitation-helpers";

const logger = createLogger({ feature: "auth", handler: "cancel-invitation" });

// ============================================================
// Types
// ============================================================

interface CancelInvitationInput {
	companyId: string;
	invitationId: string;
}

interface ElysiaContextLike {
	set: { status: number };
	headers: Record<string, string>;
}

// ============================================================
// Handler
// ============================================================

export async function cancelInvitation(
	input: CancelInvitationInput,
	ctx: ElysiaContextLike,
) {
	// 1. Authenticate
	const identity = await resolveSessionIdentityFromHeaders(ctx.headers);
	if (!identity.authUserId) {
		ctx.set.status = 401;
		return fail("Authentication required", "AUTH_REQUIRED");
	}

	const { companyId, invitationId } = input;

	// 2. Permission check
	const hasPermission = await hasInvitePermission(identity.authUserId, companyId);
	if (!hasPermission) {
		ctx.set.status = 403;
		return fail("Insufficient permissions", "FORBIDDEN");
	}

	// 3. Find invitation — scoped to company (cross-company → 404)
	const rows = await db
		.select()
		.from(authInvitations)
		.where(
			and(
				eq(authInvitations.id, invitationId),
				eq(authInvitations.companyId, companyId),
			),
		)
		.limit(1);

	const invitation = rows[0] ?? null;
	if (!invitation) {
		ctx.set.status = 404;
		return fail("Invitation not found", INVITATION_ERROR_CODES.INVITATION_NOT_FOUND);
	}

	// 4. Only pending can be cancelled
	if (invitation.status !== "pending") {
		ctx.set.status = 409;
		return fail(
			"Only pending invitations can be cancelled",
			INVITATION_ERROR_CODES.INVITATION_NOT_PENDING,
		);
	}

	// 5. Cancel (set to cancelled)
	await db
		.update(authInvitations)
		.set({ status: "cancelled", updatedAt: new Date() })
		.where(eq(authInvitations.id, invitation.id));

	logger.info(
		{ invitationId, companyId, userId: identity.authUserId },
		"Invitation cancelled",
	);

	return ok({
		invitation: {
			id: invitation.id,
			status: "cancelled",
		},
	});
}
