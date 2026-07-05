import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

const ENVELOPE_VERSION = "aes-256-gcm.v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

type EncryptionEnvelope = {
	__enc: typeof ENVELOPE_VERSION;
	iv: string;
	tag: string;
	cipher: string;
};

interface CipherContext {
	runId: string;
	toolCallId: string;
}

function resolveEncryptionKey(): Buffer | null {
	const raw = (process.env.ARKELYTHEX_AES256_KEY ?? "").trim();
	if (!raw) return null;

	if (/^[A-Fa-f0-9]{64}$/.test(raw)) {
		return Buffer.from(raw, "hex");
	}

	try {
		const maybeBase64 = Buffer.from(raw, "base64");
		if (maybeBase64.length === 32) {
			return maybeBase64;
		}
	} catch {
		// ignore and fallback to hash derivation
	}

	return createHash("sha256").update(raw).digest();
}

/**
 * Indicates whether the AES-256 key is configured and can be used to encrypt payloads.
 *
 * @returns `true` when a usable encryption key is available from environment configuration.
 * @example
 * ```ts
 * const configured = isAes256Configured();
 * console.log(typeof configured); // "boolean"
 * ```
 */
export function isAes256Configured(): boolean {
	return resolveEncryptionKey() !== null;
}

function createAad(context: CipherContext): Buffer {
	return Buffer.from(`${context.runId}:${context.toolCallId}`, "utf8");
}

function isEncryptionEnvelope(value: unknown): value is EncryptionEnvelope {
	if (!value || typeof value !== "object") return false;
	const record = value as Record<string, unknown>;
	return (
		record.__enc === ENVELOPE_VERSION &&
		typeof record.iv === "string" &&
		typeof record.tag === "string" &&
		typeof record.cipher === "string"
	);
}

/**
 * Encrypts a JSON-serializable value using AES-256-GCM when encryption is configured.
 *
 * @param value - Arbitrary JSON-compatible payload to protect.
 * @param context - Additional authenticated data used to bind encryption to a run and tool call.
 * @returns The encrypted envelope when configured, or the original value when encryption is disabled.
 * @example
 * ```ts
 * const encrypted = encryptJsonValue({ amount: 10 }, { runId: 'run_1', toolCallId: 'tool_1' });
 * ```
 */
export function encryptJsonValue(
	value: unknown,
	context: CipherContext,
): unknown {
	const key = resolveEncryptionKey();
	if (!key) return value;

	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	cipher.setAAD(createAad(context));

	const plaintext = Buffer.from(JSON.stringify(value), "utf8");
	const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();

	return {
		__enc: ENVELOPE_VERSION,
		iv: iv.toString("base64"),
		tag: tag.toString("base64"),
		cipher: encrypted.toString("base64"),
	} as EncryptionEnvelope;
}

/**
 * Decrypts a previously encrypted JSON value and falls back safely when decryption fails.
 *
 * @param value - Stored value that may be an AES envelope or plain JSON.
 * @param context - Additional authenticated data that must match the original encryption context.
 * @returns The decrypted payload, the original value, or a redacted marker when decryption fails.
 * @example
 * ```ts
 * const decrypted = decryptJsonValue(
 *   encryptJsonValue({ amount: 10 }, { runId: 'run_1', toolCallId: 'tool_1' }),
 *   { runId: 'run_1', toolCallId: 'tool_1' },
 * );
 * ```
 */
export function decryptJsonValue(
	value: unknown,
	context: CipherContext,
): unknown {
	const key = resolveEncryptionKey();
	if (!key || !isEncryptionEnvelope(value)) return value;

	try {
		const decipher = createDecipheriv(
			ALGORITHM,
			key,
			Buffer.from(value.iv, "base64"),
		);
		decipher.setAAD(createAad(context));
		decipher.setAuthTag(Buffer.from(value.tag, "base64"));

		const decrypted = Buffer.concat([
			decipher.update(Buffer.from(value.cipher, "base64")),
			decipher.final(),
		]);

		return JSON.parse(decrypted.toString("utf8")) as unknown;
	} catch {
		return {
			redacted: true,
			reason: "encrypted_payload_unavailable",
		};
	}
}
