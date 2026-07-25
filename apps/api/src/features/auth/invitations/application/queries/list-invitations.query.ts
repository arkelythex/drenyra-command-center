/**
 * List invitations query.
 *
 * GET /api/companies/:companyId/invitations
 *
 * Only users with user:invite permission can list invitations.
 * Returns pending invitations by default. Tokens are excluded from response.
 *
 * @module invitations/application/queries/list-invitations.query
 */

import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { authInvitations } from "@drenyra/persistence/schema";
import { createLogger } from "../../../../../lib/logger";
import { fail, ok } from "../../../../shared/api-response";
import { resolveSessionIdentityFromHeaders } from "../../../handlers/session-identity";
import { hasInvitePermission } from "../invitation-helpers";

const logger = createLogger({ feature: "auth", handler: "list-invitations" });

// ============================================================
// Types
// ============================================================

interface ListInvitationsInput {
	companyId: string;
}

interface ElysiaContextLike {
	set: { status: number };
	headers: Record<string, string>;
}

// ============================================================
// Handler
// ============================================================

export async function listInvitations(
	input: ListInvitationsInput,
	ctx: ElysiaContextLike,
) {
	// 1. Authenticate
	const identity = await resolveSessionIdentityFromHeaders(ctx.headers);
	if (!identity.authUserId) {
		ctx.set.status = 401;
		return fail("Authentication required", "AUTH_REQUIRED");
	}

	const { companyId } = input;

	// 2. Permission check
	const hasPermission = await hasInvitePermission(identity.authUserId, companyId);
	if (!hasPermission) {
		ctx.set.status = 403;
		return fail("Insufficient permissions", "FORBIDDEN");
	}

	// 3. Query pending invitations for company (exclude token)
	const rows = await db
		.select({
			id: authInvitations.id,
			companyId: authInvitations.companyId,
			inviteeEmail: authInvitations.inviteeEmail,
			role: authInvitations.role,
			status: authInvitations.status,
			expiresAt: authInvitations.expiresAt,
			createdAt: authInvitations.createdAt,
		})
		.from(authInvitations)
		.where(
			and(
				eq(authInvitations.companyId, companyId),
				eq(authInvitations.status, "pending"),
			),
		);

	logger.info(
		{ companyId, count: rows.length, userId: identity.authUserId },
		"Listed invitations",
	);

	return ok({
		invitations: rows.map((row) => ({
			id: row.id,
			inviteeEmail: row.inviteeEmail,
			role: row.role,
			status: row.status,
			expiresAt: row.expiresAt,
			createdAt: row.createdAt,
		})),
	});
}
