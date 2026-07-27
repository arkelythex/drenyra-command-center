/**
 * MFA Types — shared types for passkey (WebAuthn) and TOTP MFA.
 */

/** Supported MFA methods in priority order. */
export type MfaMethod = "passkey" | "totp";

/** MFA enrollment state stored per user. */
export interface MfaEnrollment {
	/** The user's primary MFA method. */
	method: MfaMethod | null;
	/** Whether MFA is enforced (true) or optional (false). */
	enforced: boolean;
	/** ISO timestamp of enrollment. */
	enrolledAt: string | null;
}

/** Recovery code state per user. */
export interface RecoveryCodeState {
	/** bcrypt-hashed recovery codes. Null at consumed index. */
	hashes: (string | null)[];
	/** Number of codes remaining. */
	remaining: number;
}

/** MFA step-up challenge response. */
export interface MfaChallenge {
	required: boolean;
	method?: MfaMethod;
	token?: string;
	message?: string;
}
