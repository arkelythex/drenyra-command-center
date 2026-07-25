/**
 * Invitation error codes.
 *
 * All error codes follow the existing pattern of string constants.
 * Errors are surfaced via the shared `fail()` helper with these codes.
 *
 * @module invitations/domain/invitation.errors
 */

export const INVITATION_ERROR_CODES = {
	INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
	ALREADY_MEMBER: "ALREADY_MEMBER",
	CANNOT_INVITE_OWNER: "CANNOT_INVITE_OWNER",
	CANNOT_INVITE_SELF: "CANNOT_INVITE_SELF",
	INVALID_ROLE: "INVALID_ROLE",
	EMAIL_MISMATCH: "EMAIL_MISMATCH",
	INVITATION_ALREADY_ACCEPTED: "INVITATION_ALREADY_ACCEPTED",
	INVITATION_ALREADY_REJECTED: "INVITATION_ALREADY_REJECTED",
	INVITATION_NOT_PENDING: "INVITATION_NOT_PENDING",
} as const;

export type InvitationErrorCode =
	(typeof INVITATION_ERROR_CODES)[keyof typeof INVITATION_ERROR_CODES];
