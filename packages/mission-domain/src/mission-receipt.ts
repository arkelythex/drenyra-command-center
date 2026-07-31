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

import { ReceiptType } from "@drenyra/mission-protocol";
import {
	createHash,
	generateKeyPairSync,
	timingSafeEqual,
	randomBytes,
	sign,
	verify,
	createPrivateKey,
	createPublicKey,
} from "node:crypto";

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
function sortedStringify(obj: Record<string, unknown>): string {
	const sortedKeys = Object.keys(obj).sort();
	const sorted: Record<string, unknown> = {};
	for (const key of sortedKeys) {
		sorted[key] = obj[key];
	}
	return JSON.stringify(sorted);
}

/**
 * Generate a SHA-256 receipt hash with canonical field ordering.
 */
export function generateReceiptHash(content: ReceiptContent): string {
	return createHash("sha256")
		.update(sortedStringify(content as unknown as Record<string, unknown>))
		.digest("hex");
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
	keyId: string,
): { signature: string; canonicalPayload: string } {
	void keyId;
	const canonicalPayload = sortedStringify(
		content as unknown as Record<string, unknown>,
	);
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
		const canonicalPayload = sortedStringify(
			content as unknown as Record<string, unknown>,
		);
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

/** The furthest verification stage reached for a signed receipt. */
export type ReceiptVerificationStatus =
	| "CONTENT_VALID"
	| "SIGNATURE_VALID"
	| "SIGNER_TRUSTED"
	| "KEY_EXPIRED"
	| "KEY_REVOKED"
	| "UNKNOWN_SIGNER"
	| "PAYLOAD_TAMPERED";

/** A trusted signing key and its lifecycle metadata. */
export interface SigningKeyInfo {
	keyId: string;
	publicKey: string;
	issuedAt: string;
	expiresAt?: string;
	revokedAt?: string;
}

/** Resolves trusted signer metadata by stable key ID. */
export type KeyTrustResolver = (
	keyId: string,
) => Promise<SigningKeyInfo | undefined> | SigningKeyInfo | undefined;

/** Individual results for every receipt verification stage. */
export interface ReceiptVerificationSteps {
	hashValid: boolean;
	signatureValid: boolean;
	signerRecognized: boolean;
	keyCurrent: boolean;
	keyRevoked: boolean;
}

/**
 * Verifies receipt integrity, signature, and trusted signer lifecycle.
 * The embedded public key establishes portable signature validity; the
 * resolved key must match it before the signer can be trusted.
 */
export async function verifySignedReceiptTrusted(
	receipt: SignedReceipt,
	resolveKey: KeyTrustResolver,
): Promise<{
	status: ReceiptVerificationStatus;
	steps: ReceiptVerificationSteps;
}> {
	const hashValid = verifyReceiptIntegrity(receipt.content, receipt.receiptHash);
	if (!hashValid) {
		return trustResult("PAYLOAD_TAMPERED", false, false, false, false, false);
	}

	const signatureValid = verifyReceiptSignature(
		receipt.content,
		receipt.signature,
		receipt.signerPublicKey,
	);
	if (!signatureValid) {
		return trustResult("CONTENT_VALID", true, false, false, false, false);
	}

	const key = await resolveKey(receipt.signerKeyId);
	const signerRecognized = key !== undefined && key.publicKey === receipt.signerPublicKey;
	if (!signerRecognized || key === undefined) {
		return trustResult("UNKNOWN_SIGNER", true, true, false, false, false);
	}

	const now = Date.now();
	const keyCurrent =
		Date.parse(key.issuedAt) <= now &&
		(key.expiresAt === undefined || Date.parse(key.expiresAt) > now);
	if (!keyCurrent) {
		return trustResult("KEY_EXPIRED", true, true, true, false, false);
	}

	const keyRevoked = key.revokedAt !== undefined && Date.parse(key.revokedAt) <= now;
	if (keyRevoked) {
		return trustResult("KEY_REVOKED", true, true, true, true, true);
	}

	return trustResult("SIGNER_TRUSTED", true, true, true, true, false);
}

function trustResult(
	status: ReceiptVerificationStatus,
	hashValid: boolean,
	signatureValid: boolean,
	signerRecognized: boolean,
	keyCurrent: boolean,
	keyRevoked: boolean,
): { status: ReceiptVerificationStatus; steps: ReceiptVerificationSteps } {
	return {
		status,
		steps: { hashValid, signatureValid, signerRecognized, keyCurrent, keyRevoked },
	};
}
