/**
 * Credential Encryption Service
 *
 * AES-256-GCM encryption for bank provider credentials at rest.
 * Uses `crypto` Web API (available in Bun, Deno, modern Node.js).
 *
 * SAFETY:
 * - Encryption key MUST be 64 hex characters (512 bits) from ENCRYPTION_KEY env var
 * - Fails fast if ENCRYPTION_KEY is not set in production
 * - Never logs or exposes raw credentials
 */

const KEY_LENGTH = 64; // 256 bits = 32 bytes = 64 hex chars

/** Parse a hex string to a Uint8Array with ArrayBuffer type. */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
	const buffer = new ArrayBuffer(hex.length / 2);
	const view = new DataView(buffer);
	for (let i = 0; i < hex.length; i += 2) {
		view.setUint8(i / 2, parseInt(hex.substring(i, i + 2), 16));
	}
	return new Uint8Array<ArrayBuffer>(buffer);
}

/**
 * Encrypted payload parts.
 */
export interface EncryptedPayload {
	ciphertext: string; // hex-encoded
	iv: string; // hex-encoded
	tag: string; // hex-encoded (authentication tag)
}

/**
 * Get the encryption key from environment.
 *
 * @returns The 64-character hex encryption key.
 * @throws Error if key is missing or invalid length in production.
 */
function getEncryptionKey(): string {
	const key = process.env.ENCRYPTION_KEY;

	if (!key || key.length === 0) {
		if (process.env.NODE_ENV === "production") {
			throw new Error(
				"ENCRYPTION_KEY is required in production. Set it to a 64-character hex string.",
			);
		}
		// Development fallback — deterministic key for reproducibility
		return "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
	}

	if (key.length !== KEY_LENGTH) {
		throw new Error(
			`ENCRYPTION_KEY must be exactly ${KEY_LENGTH} hex characters. Got ${key.length}.`,
		);
	}

	return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt.
 * @param keyHex - Optional 64-char hex key (defaults from ENCRYPTION_KEY).
 * @returns Encrypted payload with ciphertext, iv, and authentication tag.
 */
export async function encrypt(
	plaintext: string,
	keyHex?: string,
): Promise<EncryptedPayload> {
	const key = keyHex ?? getEncryptionKey();
	const keyBytes = hexToBytes(key);

	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBytes,
		{ name: "AES-GCM" },
		false,
		["encrypt"],
	);

	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encoder = new TextEncoder();
	const encoded = encoder.encode(plaintext);

	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		cryptoKey,
		encoded,
	);

	// AES-GCM returns ciphertext + authentication tag (last 16 bytes)
	const ciphertext = new Uint8Array(encrypted.slice(0, -16));
	const tag = new Uint8Array(encrypted.slice(-16));

	return {
		ciphertext: Buffer.from(ciphertext).toString("hex"),
		iv: Buffer.from(iv).toString("hex"),
		tag: Buffer.from(tag).toString("hex"),
	};
}

/**
 * Decrypt an AES-256-GCM encrypted payload.
 *
 * @param payload - The encrypted payload with ciphertext, iv, and tag.
 * @param keyHex - Optional 64-char hex key (defaults from ENCRYPTION_KEY).
 * @returns The decrypted plaintext string.
 */
export async function decrypt(
	payload: EncryptedPayload,
	keyHex?: string,
): Promise<string> {
	const key = keyHex ?? getEncryptionKey();
	const keyBytes = hexToBytes(key);

	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBytes,
		{ name: "AES-GCM" },
		false,
		["decrypt"],
	);

	const iv = hexToBytes(payload.iv);
	const ciphertext = hexToBytes(payload.ciphertext);
	const tag = hexToBytes(payload.tag);

	// Combine ciphertext + tag as AES-GCM expects
	const combined = new Uint8Array(ciphertext.length + tag.length);
	combined.set(ciphertext);
	combined.set(tag, ciphertext.length);

	const decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		cryptoKey,
		combined,
	);

	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
}
