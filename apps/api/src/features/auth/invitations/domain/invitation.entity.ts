/**
 * Invitation domain entity and validation functions.
 *
 * Invitations allow firm admins to invite users (accountants, reviewers, etc.)
 * to join a company. Invited users receive a token-based link and can accept
 * or reject the invitation.
 *
 * @module invitations/domain/invitation.entity
 */

import { randomUUID } from "node:crypto";
import type { MembershipRole } from "@drenyra/domain/scope";

// ============================================================
// Const types
// ============================================================

export const INVITATION_STATUS = {
	PENDING: "pending",
	ACCEPTED: "accepted",
	REJECTED: "rejected",
	EXPIRED: "expired",
	CANCELLED: "cancelled",
} as const;

export type InvitationStatus =
	(typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

// ============================================================
// Domain entity
// ============================================================

export interface Invitation {
	id: string;
	companyId: string;
	inviterUserId: string;
	inviteeEmail: string;
	role: MembershipRole;
	token: string;
	status: InvitationStatus;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

// ============================================================
// Validation functions
// ============================================================

/** Normalize an email address: trim whitespace and lowercase. */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/** Check if a string is a valid MembershipRole. */
export function isValidInvitationRole(role: string): role is MembershipRole {
	const VALID_ROLES: MembershipRole[] = [
		"OWNER",
		"ADMIN",
		"ACCOUNTANT",
		"REVIEWER",
		"APPROVER",
		"VIEWER",
	];
	return VALID_ROLES.includes(role as MembershipRole);
}

/** Check if a role can be used for invitations (OWNER is excluded). */
export function isInvitableRole(role: MembershipRole): boolean {
	return role !== "OWNER";
}

/** Check if a date is in the past (expired). */
export function isExpired(expiresAt: Date): boolean {
	return expiresAt.getTime() <= Date.now();
}

/** Generate a cryptographically secure invitation token (UUID v4). */
export function generateInvitationToken(): string {
	return randomUUID();
}

// ============================================================
// Status transitions
// ============================================================

const VALID_STATUSES: Set<InvitationStatus> = new Set([
	INVITATION_STATUS.PENDING,
	INVITATION_STATUS.ACCEPTED,
	INVITATION_STATUS.REJECTED,
	INVITATION_STATUS.EXPIRED,
	INVITATION_STATUS.CANCELLED,
]);

const TERMINAL_STATUSES: Set<InvitationStatus> = new Set([
	INVITATION_STATUS.ACCEPTED,
	INVITATION_STATUS.REJECTED,
	INVITATION_STATUS.EXPIRED,
	INVITATION_STATUS.CANCELLED,
]);

/**
 * Validate that a status transition is allowed.
 *
 * Only 'pending' → {accepted, rejected, expired, cancelled} is valid.
 * Terminal states cannot transition to anything.
 */
export function isValidStatusTransition(
	current: InvitationStatus,
	target: InvitationStatus,
): boolean {
	if (!VALID_STATUSES.has(current) || !VALID_STATUSES.has(target)) {
		return false;
	}

	if (current === INVITATION_STATUS.PENDING) {
		return target !== INVITATION_STATUS.PENDING;
	}

	// Any terminal state → anything is invalid
	return false;
}
