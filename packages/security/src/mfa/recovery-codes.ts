/**
 * Recovery Codes — Emergency MFA bypass.
 *
 * Technology: 8 single-use codes, each 10 characters, bcrypt-hashed.
 * When consumed, the hash at that index is replaced with null.
 * This preserves index-based audit logging.
 *
 * @module mfa/recovery-codes
 */

import { randomBytes } from "node:crypto";

const RECOVERY_CODE_COUNT = 8;
const RECOVERY_CODE_LENGTH = 10;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I,O,0,1

/** Generate RECOVERY_CODE_COUNT single-use recovery codes. */
export function generateRecoveryCodes(): string[] {
	const codes: string[] = [];
	for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
		codes.push(generateSingleCode());
	}
	return codes;
}

function generateSingleCode(): string {
	const bytes = randomBytes(RECOVERY_CODE_LENGTH);
	let code = "";
	for (const byte of bytes) {
		code += CODE_CHARS[byte % CODE_CHARS.length];
	}
	return code;
}

/** Hash a recovery code for storage (bcrypt-like simple hash for now). */
export async function hashRecoveryCode(code: string): Promise<string> {
	// Using SHA-256 as a placeholder; production should use bcrypt
	const encoder = new TextEncoder();
	const data = encoder.encode(code);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a recovery code against stored hashes.
 * Returns the index of the matched code, or -1 if no match.
 */
export async function verifyRecoveryCode(
	code: string,
	hashes: (string | null)[],
): Promise<number> {
	const inputHash = await hashRecoveryCode(code);
	for (let i = 0; i < hashes.length; i++) {
		const stored = hashes[i];
		if (stored !== null && stored === inputHash) {
			return i; // Return the index so caller can null it out
		}
	}
	return -1;
}
