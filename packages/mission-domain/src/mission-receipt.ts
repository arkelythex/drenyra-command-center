/**
 * Mission receipts — cryptographic receipt generation, verification,
 * evidence hashing, and Ed25519 signing.
 *
 * Integrity:  SHA-256 over canonical key-sorted serialization.
 * Authenticity: Ed25519 signature over the canonical payload.
 *
 * A signed receipt is self-verifying: any party with the public key can
 * confirm both integrity and authenticity without asking the issuing server.
 */

import {
	createHash,
	createPrivateKey,
	createPublicKey,
	generateKeyPairSync,
	randomBytes,
	sign,
	timingSafeEqual,
	verify,
} from "node:crypto";

export const ReceiptType = {
	APPROVAL: "APPROVAL",
	EXECUTION: "EXECUTION",
	COMPLETION: "COMPLETION",
	EXTERNAL_SUBMISSION: "EXTERNAL_SUBMISSION",
} as const;

export type ReceiptType = (typeof ReceiptType)[keyof typeof ReceiptType];

export const ReceiptVerificationStatus = {
	SIGNER_TRUSTED: "SIGNER_TRUSTED",
	UNKNOWN_SIGNER: "UNKNOWN_SIGNER",
	KEY_EXPIRED: "KEY_EXPIRED",
	KEY_REVOKED: "KEY_REVOKED",
	CONTENT_VALID: "CONTENT_VALID",
	PAYLOAD_TAMPERED: "PAYLOAD_TAMPERED",
} as const;

export type ReceiptVerificationStatus =
	(typeof ReceiptVerificationStatus)[keyof typeof ReceiptVerificationStatus];

/**
 * Content that goes into a receipt hash.
 */
export interface ReceiptContent {
	missionId: string;
	companyId: string;
	actorId: string;
	decision: "APPROVE" | "REJECT";
	proposalVersion: number;
	evidenceHash: string;
	previousStatus: string;
	newStatus: string;
	payloadHash: string;
	timestamp: string;
}

/**
 * Evidence item used in computeEvidenceHash.
 */
import type { EvidenceItem } from "./mission-contracts.js";

export type { EvidenceItem };

/**
 * Ed25519 key pair for receipt signing.
 */
export interface ReceiptKeyPair {
	publicKey: string;
	privateKey: string;
	keyId: string;
}

export interface SigningKeyInfo {
	keyId: string;
	publicKey: string;
	issuedAt: string;
	expiresAt?: string;
	revokedAt?: string;
}

export type KeyTrustResolver = (
	keyId: string,
) => SigningKeyInfo | undefined | Promise<SigningKeyInfo | undefined>;

export interface ReceiptVerificationSteps {
	hashValid: boolean;
	signatureValid: boolean;
	signerRecognized: boolean;
	keyCurrent: boolean;
	keyRevoked: boolean;
}

/**
 * Complete signed receipt bundle — the portable, self-verifying artifact.
 */
export interface SignedReceipt {
	protocolVersion: string;
	receiptType: ReceiptType;
	algorithm: "Ed25519";
	content: ReceiptContent;
	receiptHash: string;
	signerKeyId: string;
	signerPublicKey: string;
	signature: string;
	issuedAt: string;
}

/**
 * Serialize an object with keys sorted alphabetically.
 */
function sortedStringify(obj: ReceiptContent): string {
	const sorted = Object.fromEntries(
		Object.entries(obj).sort(([left], [right]) => left.localeCompare(right)),
	);
	return JSON.stringify(sorted);
}

/**
 * Generate a SHA-256 receipt hash with canonical field ordering.
 */
export function generateReceiptHash(content: ReceiptContent): string {
	return createHash("sha256").update(sortedStringify(content)).digest("hex");
}

/**
 * Verify that a receipt content matches its asserted hash.
 * Uses timing-safe comparison.
 */
export function verifyReceiptIntegrity(
	content: ReceiptContent,
	assertedHash: string,
): boolean {
	const computed = generateReceiptHash(content);
	const computedBuf = Buffer.from(computed, "hex");
	const assertedBuf = Buffer.from(assertedHash, "hex");

	if (computedBuf.length !== assertedBuf.length) {
		return false;
	}

	return timingSafeEqual(computedBuf, assertedBuf);
}

/**
 * Compute SHA-256 hash of evidence array, sorted by id.
 */
export function computeEvidenceHash(evidence: EvidenceItem[]): string {
	const sorted = [...evidence].sort((a, b) => a.id.localeCompare(b.id));
	return createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}

// ─── Ed25519 signing ─────────────────────────────────────────────────────────

/**
 * Generate an Ed25519 key pair for receipt signing.
 */
export function generateReceiptKeyPair(keyId?: string): ReceiptKeyPair {
	const { publicKey, privateKey } = generateKeyPairSync("ed25519");
	return {
		publicKey: publicKey
			.export({ type: "spki", format: "der" })
			.toString("base64"),
		privateKey: privateKey
			.export({ type: "pkcs8", format: "der" })
			.toString("base64"),
		keyId: keyId ?? "key_" + randomBytes(4).toString("hex"),
	};
}

/**
 * Sign a receipt content with an Ed25519 private key.
 * The signature covers the canonical payload bytes, stable across languages.
 */
export function signReceipt(
	content: ReceiptContent,
	privateKeyBase64: string,
	_keyId: string,
): { signature: string; canonicalPayload: string } {
	const canonicalPayload = sortedStringify(content);
	const privateKey = createPrivateKey({
		key: Buffer.from(privateKeyBase64, "base64"),
		format: "der",
		type: "pkcs8",
	});

	const signature = sign(
		null,
		Buffer.from(canonicalPayload, "utf-8"),
		privateKey,
	);

	return {
		signature: signature.toString("base64"),
		canonicalPayload,
	};
}

/**
 * Verify an Ed25519 signature over a receipt's canonical payload.
 */
export function verifyReceiptSignature(
	content: ReceiptContent,
	signatureBase64: string,
	publicKeyBase64: string,
): boolean {
	try {
		const canonicalPayload = sortedStringify(content);
		const publicKey = createPublicKey({
			key: Buffer.from(publicKeyBase64, "base64"),
			format: "der",
			type: "spki",
		});
		const signature = Buffer.from(signatureBase64, "base64");

		return verify(
			null,
			Buffer.from(canonicalPayload, "utf-8"),
			publicKey,
			signature,
		);
	} catch {
		return false;
	}
}

/**
 * Build a complete signed receipt bundle.
 */
export function buildSignedReceipt(
	content: ReceiptContent,
	keyPair: ReceiptKeyPair,
	protocolVersion = "1.0",
	receiptType: ReceiptType = ReceiptType.APPROVAL,
): SignedReceipt {
	const receiptHash = generateReceiptHash(content);
	const { signature } = signReceipt(content, keyPair.privateKey, keyPair.keyId);

	return {
		protocolVersion,
		receiptType,
		algorithm: "Ed25519",
		content,
		receiptHash,
		signerKeyId: keyPair.keyId,
		signerPublicKey: keyPair.publicKey,
		signature,
		issuedAt: new Date().toISOString(),
	};
}

/**
 * Full verification of a signed receipt bundle:
 * 1. Content hash integrity
 * 2. Ed25519 signature authenticity
 */
export function verifySignedReceipt(receipt: SignedReceipt): {
	valid: boolean;
	hashValid: boolean;
	signatureValid: boolean;
	keyId: string;
	protocolVersion: string;
} {
	const hashValid = verifyReceiptIntegrity(
		receipt.content,
		receipt.receiptHash,
	);
	const signatureValid = verifyReceiptSignature(
		receipt.content,
		receipt.signature,
		receipt.signerPublicKey,
	);

	return {
		valid: hashValid && signatureValid,
		hashValid,
		signatureValid,
		keyId: receipt.signerKeyId,
		protocolVersion: receipt.protocolVersion,
	};
}

export async function verifySignedReceiptTrusted(
	receipt: SignedReceipt,
	resolveKey: KeyTrustResolver,
): Promise<{
	status: ReceiptVerificationStatus;
	steps: ReceiptVerificationSteps;
}> {
	const failedSteps: ReceiptVerificationSteps = {
		hashValid: false,
		signatureValid: false,
		signerRecognized: false,
		keyCurrent: false,
		keyRevoked: false,
	};

	if (!verifyReceiptIntegrity(receipt.content, receipt.receiptHash)) {
		return {
			status: ReceiptVerificationStatus.PAYLOAD_TAMPERED,
			steps: failedSteps,
		};
	}

	const signatureValid = verifyReceiptSignature(
		receipt.content,
		receipt.signature,
		receipt.signerPublicKey,
	);
	if (!signatureValid) {
		return {
			status: ReceiptVerificationStatus.CONTENT_VALID,
			steps: { ...failedSteps, hashValid: true },
		};
	}

	const key = await resolveKey(receipt.signerKeyId);
	if (key === undefined || key.publicKey !== receipt.signerPublicKey) {
		return {
			status: ReceiptVerificationStatus.UNKNOWN_SIGNER,
			steps: {
				...failedSteps,
				hashValid: true,
				signatureValid: true,
			},
		};
	}

	const now = Date.now();
	if (key.expiresAt !== undefined && Date.parse(key.expiresAt) <= now) {
		return {
			status: ReceiptVerificationStatus.KEY_EXPIRED,
			steps: {
				hashValid: true,
				signatureValid: true,
				signerRecognized: true,
				keyCurrent: false,
				keyRevoked: false,
			},
		};
	}

	if (key.revokedAt !== undefined && Date.parse(key.revokedAt) <= now) {
		return {
			status: ReceiptVerificationStatus.KEY_REVOKED,
			steps: {
				hashValid: true,
				signatureValid: true,
				signerRecognized: true,
				keyCurrent: true,
				keyRevoked: true,
			},
		};
	}

	return {
		status: ReceiptVerificationStatus.SIGNER_TRUSTED,
		steps: {
			hashValid: true,
			signatureValid: true,
			signerRecognized: true,
			keyCurrent: true,
			keyRevoked: false,
		},
	};
}
