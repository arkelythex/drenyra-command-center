/**
 * Invitations module barrel export.
 *
 * Re-exports routes and domain types for external consumption.
 *
 * @module invitations
 */

export {
	generateInvitationToken,
	INVITATION_STATUS,
	type Invitation,
	type InvitationStatus,
	isExpired,
	isInvitableRole,
	isValidInvitationRole,
	isValidStatusTransition,
	normalizeEmail,
} from "./domain/invitation.entity";
export {
	INVITATION_ERROR_CODES,
	type InvitationErrorCode,
} from "./domain/invitation.errors";
export { invitationRoutes } from "./invitations.routes";
