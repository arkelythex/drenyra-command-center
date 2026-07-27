/**
 * TOTP Implementation (RFC 6238) — Fallback MFA method.
 *
 * Used when passkeys (WebAuthn) are unavailable. TOTP provides AAL2
 * authentication per NIST SP 800-63-4.
 *
 * @module mfa/totp
 */

import { createHmac, randomBytes } from "node:crypto";

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_WINDOW = 1;

/** Generate a 20-byte base32-encoded TOTP secret. */
export function generateTotpSecret(): string {
	const secret = randomBytes(20);
	return base32Encode(secret);
}

/** Generate the `otpauth://` URI for QR code display. */
export function generateTotpUri(
	secret: string,
	email: string,
	issuer = "Drenyra",
): string {
	const encodedIssuer = encodeURIComponent(issuer);
	const encodedEmail = encodeURIComponent(email);
	return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/** Verify a TOTP code against a secret. */
export function verifyTotp(
	secret: string,
	code: string,
	window = TOTP_WINDOW,
): boolean {
	if (!/^\d{6}$/.test(code)) return false;

	const decoded = base32Decode(secret);
	const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);

	for (let i = -window; i <= window; i++) {
		const expected = generateTotpForCounter(decoded, counter + i);
		if (constantTimeCompare(code, expected)) return true;
	}

	return false;
}

function generateTotpForCounter(key: Buffer, startCounter: number): string {
	const buffer = Buffer.alloc(8);
	let remaining = startCounter;
	for (let i = 7; i >= 0; i--) {
		buffer[i] = remaining & 0xff;
		remaining >>= 8;
	}

	const hmac = createHmac("sha1", key).update(buffer).digest();
	const lastByte = hmac[hmac.length - 1];
	if (lastByte === undefined) return "000000";
	const offset = lastByte & 0xf;
	const b0 = hmac[offset] ?? 0;
	const b1 = hmac[offset + 1] ?? 0;
	const b2 = hmac[offset + 2] ?? 0;
	const b3 = hmac[offset + 3] ?? 0;
	const code = ((b0 & 0x7f) << 24) | (b1 << 16) | (b2 << 8) | b3;

	return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

function constantTimeCompare(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}

const BASE32_LOOKUP: Record<string, number> = {};
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
for (let i = 0; i < BASE32_ALPHABET.length; i++) {
	const c = BASE32_ALPHABET[i];
	if (c !== undefined) BASE32_LOOKUP[c] = i;
}

function base32Encode(buffer: Buffer): string {
	let bits = 0;
	let value = 0;
	let output = "";

	for (const byte of buffer) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			output += BASE32_ALPHABET[(value >> (bits - 5)) & 0x1f];
			bits -= 5;
		}
	}

	if (bits > 0) {
		output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
	}

	return output;
}

function base32Decode(encoded: string): Buffer {
	const cleaned = encoded.replace(/=+$/, "").toUpperCase();
	const bytes: number[] = [];
	let buffer = 0;
	let bitsLeft = 0;

	for (const char of cleaned) {
		const value = BASE32_LOOKUP[char];
		if (value === undefined) continue;
		buffer = (buffer << 5) | value;
		bitsLeft += 5;
		if (bitsLeft >= 8) {
			bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
			bitsLeft -= 8;
		}
	}

	return Buffer.from(bytes);
}
