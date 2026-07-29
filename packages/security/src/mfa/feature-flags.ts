/**
 * MFA Feature Flags — runtime-safe toggle for MFA functionality.
 *
 * When TOTP_ENABLED is false, the MFA middleware is a no-op and
 * enrollment endpoints return "MFA not available".
 *
 * @module mfa/feature-flags
 */

export const MFA_FEATURE_FLAGS = {
	/** Master switch: when false, MFA middleware is a no-op */
	get TOTP_ENABLED(): boolean {
		return process.env.TOTP_ENABLED !== "false";
	},

	/** When true, MFA enrollment is available (opt-in) */
	get MFA_OPT_IN(): boolean {
		return process.env.MFA_OPT_IN !== "false";
	},
} as const;
