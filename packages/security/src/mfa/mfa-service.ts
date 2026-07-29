/**
 * MFA Service — core business logic for MFA enrollment, verification,
 * recovery, and disable operations.
 *
 * This module is framework-agnostic. It operates on plain data and
 * is consumed by BetterAuth plugins and Elysia route handlers.
 *
 * @module mfa/mfa-service
 */

import { generateTotpSecret, generateTotpUri, verifyTotp } from "./totp";
import {
	generateRecoveryCodes,
	hashRecoveryCode,
	verifyRecoveryCode,
} from "./recovery-codes";
import { MFA_FEATURE_FLAGS } from "./feature-flags";

/** User record subset needed for MFA operations. */
export interface MfaUser {
	id: string;
	email: string;
	totpSecret: string | null;
	totpEnabled: boolean;
	recoveryCodes: (string | null)[];
	mfaFailureCount: number;
}

/** Result of MFA enrollment initiation. */
export interface EnrollmentInit {
	secret: string;
	uri: string;
}

/** Result of successful enrollment verification. */
export interface EnrollmentComplete {
	success: true;
	recoveryCodes: string[];
}

/** Result of MFA verification (login step-up). */
export interface MfaVerificationResult {
	success: boolean;
	failureCount: number;
	locked: boolean;
}

/** Database adapter interface for MFA persistence. */
export interface MfaDbAdapter {
	findUserById(id: string): Promise<MfaUser | null>;
	findUserByEmail(email: string): Promise<MfaUser | null>;
	updateTotpSecret(userId: string, secret: string): Promise<void>;
	enableTotp(
		userId: string,
		recoveryCodeHashes: (string | null)[],
	): Promise<void>;
	disableTotp(userId: string): Promise<void>;
	incrementMfaFailure(userId: string): Promise<number>;
	resetMfaFailure(userId: string): Promise<void>;
	consumeRecoveryCode(userId: string, index: number): Promise<void>;
}

/**
 * Initialize MFA enrollment for a user.
 * Generates a TOTP secret and returns it with a provisioning URI.
 * The secret is stored temporarily but NOT enabled until verified.
 */
export async function initiateEnrollment(
	user: MfaUser,
	db: MfaDbAdapter,
): Promise<EnrollmentInit> {
	if (!MFA_FEATURE_FLAGS.TOTP_ENABLED) {
		throw new MfaNotAvailableError();
	}

	if (user.totpEnabled) {
		throw new MfaAlreadyEnabledError();
	}

	const secret = generateTotpSecret();
	const uri = generateTotpUri(secret, user.email);

	// Store the secret but do NOT enable yet
	await db.updateTotpSecret(user.id, secret);

	return { secret, uri };
}

/**
 * Complete MFA enrollment by verifying a TOTP code.
 * On success, enables MFA and generates recovery codes.
 * Returns recovery codes (plaintext — shown once).
 */
export async function completeEnrollment(
	user: MfaUser,
	code: string,
	db: MfaDbAdapter,
): Promise<EnrollmentComplete> {
	if (!MFA_FEATURE_FLAGS.TOTP_ENABLED) {
		throw new MfaNotAvailableError();
	}

	if (user.totpEnabled) {
		throw new MfaAlreadyEnabledError();
	}

	if (!user.totpSecret) {
		throw new MfaEnrollmentNotStartedError();
	}

	if (!verifyTotp(user.totpSecret, code)) {
		throw new InvalidTotpCodeError();
	}

	const plaintextCodes = generateRecoveryCodes();
	const hashes: (string | null)[] = [];
	for (const rc of plaintextCodes) {
		hashes.push(await hashRecoveryCode(rc));
	}

	await db.enableTotp(user.id, hashes);

	return {
		success: true,
		recoveryCodes: plaintextCodes,
	};
}

/**
 * Verify a TOTP code during login challenge.
 * Tracks failure count; locks after 5 consecutive failures.
 */
export async function verifyMfaChallenge(
	user: MfaUser,
	code: string,
	db: MfaDbAdapter,
): Promise<MfaVerificationResult> {
	if (!user.totpEnabled || !user.totpSecret) {
		return { success: false, failureCount: 0, locked: false };
	}

	if (user.mfaFailureCount >= 5) {
		return { success: false, failureCount: user.mfaFailureCount, locked: true };
	}

	if (!verifyTotp(user.totpSecret, code)) {
		const newCount = await db.incrementMfaFailure(user.id);
		const locked = newCount >= 5;
		return { success: false, failureCount: newCount, locked };
	}

	// Success — reset failure counter
	await db.resetMfaFailure(user.id);
	return { success: true, failureCount: 0, locked: false };
}

/**
 * Verify a recovery code and consume it.
 * Returns true if the code was valid and consumed.
 */
export async function redeemRecoveryCode(
	user: MfaUser,
	code: string,
	db: MfaDbAdapter,
): Promise<boolean> {
	const index = await verifyRecoveryCode(code, user.recoveryCodes);
	if (index < 0) return false;

	await db.consumeRecoveryCode(user.id, index);
	await db.resetMfaFailure(user.id);
	return true;
}

/**
 * Disable MFA for a user. Clears secret, enabled flag, and recovery codes.
 */
export async function disableMfa(
	user: MfaUser,
	db: MfaDbAdapter,
): Promise<void> {
	if (!user.totpEnabled) {
		throw new MfaNotEnabledError();
	}

	await db.disableTotp(user.id);
}

// ── Error types ──

export class MfaNotAvailableError extends Error {
	constructor() {
		super("MFA no está disponible en este momento");
		this.name = "MfaNotAvailableError";
	}
}

export class MfaAlreadyEnabledError extends Error {
	constructor() {
		super("MFA ya está habilitado en esta cuenta");
		this.name = "MfaAlreadyEnabledError";
	}
}

export class MfaNotEnabledError extends Error {
	constructor() {
		super("MFA no está habilitado en esta cuenta");
		this.name = "MfaNotEnabledError";
	}
}

export class MfaEnrollmentNotStartedError extends Error {
	constructor() {
		super("No se ha iniciado el proceso de enrollment de MFA");
		this.name = "MfaEnrollmentNotStartedError";
	}
}

export class InvalidTotpCodeError extends Error {
	constructor() {
		super("Código TOTP inválido");
		this.name = "InvalidTotpCodeError";
	}
}
