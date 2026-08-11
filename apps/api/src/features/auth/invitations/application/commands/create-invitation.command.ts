/**
 * Create invitation handler.
 *
 * POST /api/companies/:companyId/invitations
 *
 * Only users with user:invite permission (OWNER, ADMIN) can create invitations.
 *
 * @module invitations/application/commands/create-invitation.command
 */

import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { authInvitations, authUserCompanies, authUsers } from "@drenyra/persistence/schema";
import type { MembershipRole } from "@drenyra/domain/scope";
import { createLogger } from "../../../../../lib/logger";
import { fail, ok } from "../../../../shared/api-response";
import { resolveSessionIdentityFromHeaders } from "../../../handlers/session-identity";
import {
	generateInvitationToken,
	isInvitableRole,
	isValidInvitationRole,
	normalizeEmail,
} from "../../domain/invitation.entity";
import { INVITATION_ERROR_CODES } from "../../domain/invitation.errors";
import { hasInvitePermission, getUserEmail } from "../invitation-helpers";

const logger = createLogger({ feature: "auth", handler: "create-invitation" });

// ============================================================
// Types
// ============================================================

interface CreateInvitationInput {
	companyId: string;
	body: {
		email: string;
		role: string;
	};
}

interface ElysiaContextLike {
	set: { status: number };
	headers: Record<string, string>;
}

// ============================================================
// Helpers
// ============================================================

async function findExistingMemberByEmail(
	email: string,
	companyId: string,
): Promise<boolean> {
	const normalizedEmail = normalizeEmail(email);

	const memberCheck = await db
		.select({ email: authUsers.email })
		.from(authUserCompanies)
		.innerJoin(authUsers, eq(authUserCompanies.userId, authUsers.id))
		.where(
			and(
				eq(authUserCompanies.companyId, companyId),
				eq(authUserCompanies.membershipStatus, "active"),
			),
		);

	return memberCheck.some(
		(row) => normalizeEmail(row.email) === normalizedEmail,
	);
}

async function findExistingPendingInvitation(
	email: string,
	companyId: string,
) {
	const normalizedEmail = normalizeEmail(email);
	const rows = await db
		.select()
		.from(authInvitations)
		.where(
			and(
				eq(authInvitations.companyId, companyId),
				eq(authInvitations.inviteeEmail, normalizedEmail),
				eq(authInvitations.status, "pending"),
			),
		)
		.limit(1);

	return rows[0] ?? null;
}

// ============================================================
// Handler
// ============================================================

export async function createInvitation(
	input: CreateInvitationInput,
	ctx: ElysiaContextLike,
) {
	// 1. Resolve session identity
	const identity = await resolveSessionIdentityFromHeaders(ctx.headers);
	if (!identity.authUserId) {
		ctx.set.status = 401;
		return fail("Authentication required", "AUTH_REQUIRED");
	}

	const { companyId } = input;
	const email = input.body.email;
	const role = input.body.role;

	// 2. Validate role
	if (!isValidInvitationRole(role)) {
		ctx.set.status = 422;
		return fail("Invalid role", INVITATION_ERROR_CODES.INVALID_ROLE);
	}

	if (!isInvitableRole(role as MembershipRole)) {
		ctx.set.status = 422;
		return fail("Cannot invite with OWNER role", INVITATION_ERROR_CODES.CANNOT_INVITE_OWNER);
	}

	// 3. Validate permission
	const hasPermission = await hasInvitePermission(identity.authUserId, companyId);
	if (!hasPermission) {
		ctx.set.status = 403;
		return fail("Insufficient permissions", "FORBIDDEN");
	}

	const normalizedEmail = normalizeEmail(email);

	// 4. Check self-invite
	const sessionEmail = await getUserEmail(identity.authUserId);
	if (sessionEmail && normalizeEmail(sessionEmail) === normalizedEmail) {
		ctx.set.status = 422;
		return fail("Cannot invite yourself", INVITATION_ERROR_CODES.CANNOT_INVITE_SELF);
	}

	// 5. Check already member
	const isAlreadyMember = await findExistingMemberByEmail(normalizedEmail, companyId);
	if (isAlreadyMember) {
		ctx.set.status = 409;
		return fail(
			"User is already a member of this company",
			INVITATION_ERROR_CODES.ALREADY_MEMBER,
		);
	}

	// 6. Idempotency: check existing pending invitation
	const existing = await findExistingPendingInvitation(normalizedEmail, companyId);
	if (existing) {
		ctx.set.status = 200;
		return ok({
			invitation: {
				id: existing.id,
				companyId: existing.companyId,
				inviteeEmail: existing.inviteeEmail,
				role: existing.role,
				status: existing.status,
				token: existing.token,
				expiresAt: existing.expiresAt,
				createdAt: existing.createdAt,
			},
		});
	}

	// 7. Create invitation
	const token = generateInvitationToken();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

	const [invitation] = await db
		.insert(authInvitations)
		.values({
			id: token,
			companyId,
			inviterUserId: identity.authUserId,
			inviteeEmail: normalizedEmail,
			role: role as MembershipRole,
			token,
			status: "pending",
			expiresAt,
		})
		.returning();

	if (!invitation) {
		return fail("Failed to create invitation", "INTERNAL_ERROR");
	}

	ctx.set.status = 201;
	logger.info({ invitationId: invitation.id, companyId }, "Invitation created");

	return ok({
		invitation: {
			id: invitation.id,
			companyId: invitation.companyId,
			inviteeEmail: invitation.inviteeEmail,
			role: invitation.role,
			status: invitation.status,
			token: invitation.token,
			expiresAt: invitation.expiresAt,
			createdAt: invitation.createdAt,
		},
	});
}
