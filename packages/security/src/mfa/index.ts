export { mfaPlugin } from "./better-auth-mfa-plugin";
export { MFA_FEATURE_FLAGS } from "./feature-flags";
export type {
	EnrollmentComplete,
	EnrollmentInit,
	MfaDbAdapter,
	MfaUser,
	MfaVerificationResult,
} from "./mfa-service";
export {
	completeEnrollment,
	disableMfa,
	InvalidTotpCodeError,
	initiateEnrollment,
	MfaAlreadyEnabledError,
	MfaEnrollmentNotStartedError,
	MfaNotAvailableError,
	MfaNotEnabledError,
	redeemRecoveryCode,
	verifyMfaChallenge,
} from "./mfa-service";
export {
	generateRecoveryCodes,
	hashRecoveryCode,
	verifyRecoveryCode,
} from "./recovery-codes";
export { generateTotpSecret, generateTotpUri, verifyTotp } from "./totp";
export type { MfaChallenge, MfaEnrollment, MfaMethod } from "./types";
