import {
	createCipheriv,
	createDecipheriv,
	pbkdf2Sync,
	randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Serialized encrypted payload metadata (AES-256-GCM).
 *
 * @example
 * ```ts
 * const payload: EncryptedData = {
 *   cipher: "base64",
 *   iv: "base64",
 *   tag: "base64",
 *   salt: "base64",
 *   version: "drenyra.e2e.v1",
 * };
 * ```
 */
export interface EncryptedData {
	cipher: string;
	iv: string;
	tag: string;
	salt: string;
	version: string;
}

/**
 * Stored user key bundle metadata for encrypted workflows.
 *
 * @example
 * ```ts
 * const pair: UserKeyPair = {
 *   userId: "usr_1",
 *   encryptedPrivateKey: "base64",
 * };
 * ```
 */
export interface UserKeyPair {
	userId: string;
	publicKey?: string;
	encryptedPrivateKey: string;
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
	return pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Encrypts plaintext with a passphrase using AES-256-GCM + PBKDF2.
 *
 * @param plaintext - UTF-8 plaintext data
 * @param passphrase - User-secret passphrase used for key derivation
 * @returns Encrypted payload with IV/tag/salt metadata
 * @example
 * ```ts
 * const encrypted = encryptWithPassphrase("sensitive", "passphrase-123");
 * ```
 */
export function encryptWithPassphrase(
	plaintext: string,
	passphrase: string,
): EncryptedData {
	const salt = randomBytes(SALT_LENGTH);
	const iv = randomBytes(IV_LENGTH);
	const key = deriveKey(passphrase, salt);

	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();

	return {
		cipher: encrypted.toString("base64"),
		iv: iv.toString("base64"),
		tag: tag.toString("base64"),
		salt: salt.toString("base64"),
		version: "drenyra.e2e.v1",
	};
}

/**
 * Decrypts an `EncryptedData` payload using the original passphrase.
 *
 * @param encrypted - Encrypted payload bundle
 * @param passphrase - Passphrase used at encryption time
 * @returns Restored plaintext string
 * @example
 * ```ts
 * const plaintext = decryptWithPassphrase(encryptedPayload, "passphrase-123");
 * ```
 */
export function decryptWithPassphrase(
	encrypted: EncryptedData,
	passphrase: string,
): string {
	const salt = Buffer.from(encrypted.salt, "base64");
	const iv = Buffer.from(encrypted.iv, "base64");
	const tag = Buffer.from(encrypted.tag, "base64");
	const key = deriveKey(passphrase, salt);

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(tag);

	const decrypted = Buffer.concat([
		decipher.update(encrypted.cipher, "base64"),
		decipher.final(),
	]);

	return decrypted.toString("utf8");
}

/**
 * Encrypts fiscal JSON payloads for at-rest secure storage/transit.
 *
 * @param data - Fiscal payload object
 * @param userPassphrase - User passphrase for encryption
 * @returns Encrypted fiscal payload
 * @example
 * ```ts
 * const encrypted = encryptFiscalData({ ruc: "20100070970" }, "passphrase-123");
 * ```
 */
export function encryptFiscalData(
	data: Record<string, unknown>,
	userPassphrase: string,
): EncryptedData {
	return encryptWithPassphrase(JSON.stringify(data), userPassphrase);
}

/**
 * Decrypts and deserializes fiscal payload objects.
 *
 * @typeParam T - Generic type parameter for decryptFiscalData.
 * @param encrypted - Encrypted fiscal payload
 * @param userPassphrase - User passphrase for decryption
 * @returns Parsed fiscal object typed as `T`
 * @example
 * ```ts
 * const payload = decryptFiscalData<{ ruc: string }>(encryptedPayload, "passphrase-123");
 * ```
 */
export function decryptFiscalData<T>(
	encrypted: EncryptedData,
	userPassphrase: string,
): T {
	const decrypted = decryptWithPassphrase(encrypted, userPassphrase);
	return JSON.parse(decrypted) as T;
}
