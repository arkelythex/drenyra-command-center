import {
	createCipheriv,
	createDecipheriv,
	pbkdf2Sync,
	randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;
function deriveKey(passphrase, salt) {
	return pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, "sha512");
}
export function encryptWithPassphrase(plaintext, passphrase) {
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
export function decryptWithPassphrase(encrypted, passphrase) {
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
export function encryptFiscalData(data, userPassphrase) {
	return encryptWithPassphrase(JSON.stringify(data), userPassphrase);
}
export function decryptFiscalData(encrypted, userPassphrase) {
	const decrypted = decryptWithPassphrase(encrypted, userPassphrase);
	return JSON.parse(decrypted);
}
