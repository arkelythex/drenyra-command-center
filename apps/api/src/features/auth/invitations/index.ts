/**
 * Invitations module barrel export.
 *
 * Re-exports routes and domain types for external consumption.
 *
 * @module invitations
 */

export { invitationRoutes } from "./invitations.routes";

export {
	INVITATION_STATUS,
	type InvitationStatus,
	type Invitation,
	normalizeEmail,
	isValidInvitationRole,
	isInvitableRole,
	isExpired,
	generateInvitationToken,
	isValidStatusTransition,
} from "./domain/invitation.entity";

export { INVITATION_ERROR_CODES, type InvitationErrorCode } from "./domain/invitation.errors";
