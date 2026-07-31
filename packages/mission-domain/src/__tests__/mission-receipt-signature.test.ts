import { describe, expect, it } from "vitest";
import { ReceiptType } from "@drenyra/mission-protocol";
import {
	generateReceiptKeyPair,
	generateReceiptHash,
	signReceipt,
	verifyReceiptSignature,
	buildSignedReceipt,
	verifySignedReceipt,
	verifySignedReceiptTrusted,
	type ReceiptContent,
	type SigningKeyInfo,
} from "../mission-receipt.js";

const content: ReceiptContent = {
	missionId: "mis_123",
	companyId: "cmp_123",
	actorId: "user_456",
	decision: "APPROVE",
	proposalVersion: 3,
	evidenceHash: "a1b2c3d4e5",
	previousStatus: "AWAITING_APPROVAL",
	newStatus: "APPROVED",
	payloadHash: "f6e7d8c9b0",
	timestamp: "2026-07-30T12:00:00Z",
};

describe("Ed25519 receipt signing", () => {
	it("generates a key pair with key ID", () => {
		const keyPair = generateReceiptKeyPair("key_test_001");
		expect(keyPair.publicKey).toBeTruthy();
		expect(keyPair.privateKey).toBeTruthy();
		expect(keyPair.keyId).toBe("key_test_001");
	});

	it("generates unique key IDs when not provided", () => {
		const kp1 = generateReceiptKeyPair();
		const kp2 = generateReceiptKeyPair();
		expect(kp1.keyId).not.toBe(kp2.keyId);
	});

	it("signs and verifies a receipt signature", () => {
		const keyPair = generateReceiptKeyPair();
		const { signature } = signReceipt(
			content,
			keyPair.privateKey,
			keyPair.keyId,
		);
		expect(signature).toBeTruthy();

		const valid = verifyReceiptSignature(content, signature, keyPair.publicKey);
		expect(valid).toBe(true);
	});

	it("rejects signature with wrong key", () => {
		const keyPairA = generateReceiptKeyPair();
		const keyPairB = generateReceiptKeyPair();
		const { signature } = signReceipt(
			content,
			keyPairA.privateKey,
			keyPairA.keyId,
		);

		const valid = verifyReceiptSignature(
			content,
			signature,
			keyPairB.publicKey,
		);
		expect(valid).toBe(false);
	});

	it("rejects signature over tampered content", () => {
		const keyPair = generateReceiptKeyPair();
		const { signature } = signReceipt(
			content,
			keyPair.privateKey,
			keyPair.keyId,
		);

		const tampered: ReceiptContent = {
			...content,
			evidenceHash: "TAMPERED",
		};
		const valid = verifyReceiptSignature(
			tampered,
			signature,
			keyPair.publicKey,
		);
		expect(valid).toBe(false);
	});

	it("builds a complete signed receipt bundle", () => {
		const keyPair = generateReceiptKeyPair("key_prod_001");
		const receipt = buildSignedReceipt(content, keyPair);

		expect(receipt.protocolVersion).toBe("1.0");
		expect(receipt.receiptType).toBe(ReceiptType.APPROVAL);
		expect(receipt.algorithm).toBe("Ed25519");
		expect(receipt.receiptHash).toHaveLength(64); // SHA-256 hex
		expect(receipt.signerKeyId).toBe("key_prod_001");
		expect(receipt.signerPublicKey).toBe(keyPair.publicKey);
		expect(receipt.signature).toBeTruthy();
		expect(receipt.issuedAt).toBeTruthy();
	});

	it("builds typed receipt bundles without hashing type metadata", () => {
		const keyPair = generateReceiptKeyPair();
		const receipt = buildSignedReceipt(content, keyPair, "1.0", ReceiptType.COMPLETION);

		expect(receipt.receiptType).toBe(ReceiptType.COMPLETION);
		expect(receipt.algorithm).toBe("Ed25519");
		expect(receipt.receiptHash).toBe(generateReceiptHash(content));
	});

	it("verifySignedReceipt returns valid for authentic receipt", () => {
		const keyPair = generateReceiptKeyPair();
		const receipt = buildSignedReceipt(content, keyPair);

		const result = verifySignedReceipt(receipt);
		expect(result.valid).toBe(true);
		expect(result.hashValid).toBe(true);
		expect(result.signatureValid).toBe(true);
		expect(result.keyId).toBe(keyPair.keyId);
	});

	it("verifySignedReceipt detects tampered hash", () => {
		const keyPair = generateReceiptKeyPair();
		const receipt = buildSignedReceipt(content, keyPair);
		// Tamper with content but keep signature
		receipt.content = { ...content, actorId: "attacker" };

		const result = verifySignedReceipt(receipt);
		expect(result.hashValid).toBe(false);
		expect(result.signatureValid).toBe(false);
		expect(result.valid).toBe(false);
	});

	it("verifySignedReceipt detects wrong signer", () => {
		const keyPairA = generateReceiptKeyPair();
		const keyPairB = generateReceiptKeyPair();
		const receipt = buildSignedReceipt(content, keyPairA);
		// Replace public key with a different signer's key
		receipt.signerPublicKey = keyPairB.publicKey;

		const result = verifySignedReceipt(receipt);
		expect(result.hashValid).toBe(true); // hash still valid
		expect(result.signatureValid).toBe(false); // signature no longer matches
		expect(result.valid).toBe(false);
	});

	it("verifies trusted receipts through every trust stage", async () => {
		const keyPair = generateReceiptKeyPair("key_trusted");
		const receipt = buildSignedReceipt(content, keyPair);
		const validKey: SigningKeyInfo = {
			keyId: keyPair.keyId,
			publicKey: keyPair.publicKey,
			issuedAt: "2020-01-01T00:00:00.000Z",
		};

		await expect(verifySignedReceiptTrusted(receipt, () => undefined)).resolves.toMatchObject({
			status: "UNKNOWN_SIGNER",
			steps: { hashValid: true, signatureValid: true, signerRecognized: false },
		});
		await expect(verifySignedReceiptTrusted({ ...receipt, content: { ...content, actorId: "tampered" } }, () => validKey)).resolves.toMatchObject({
			status: "PAYLOAD_TAMPERED",
			steps: { hashValid: false },
		});
		await expect(verifySignedReceiptTrusted({ ...receipt, signature: "invalid" }, () => validKey)).resolves.toMatchObject({
			status: "CONTENT_VALID",
			steps: { hashValid: true, signatureValid: false },
		});
		await expect(verifySignedReceiptTrusted(receipt, () => ({ ...validKey, expiresAt: "2021-01-01T00:00:00.000Z" }))).resolves.toMatchObject({
			status: "KEY_EXPIRED",
			steps: { keyCurrent: false },
		});
		await expect(verifySignedReceiptTrusted(receipt, async () => ({ ...validKey, revokedAt: "2021-01-01T00:00:00.000Z" }))).resolves.toMatchObject({
			status: "KEY_REVOKED",
			steps: { keyCurrent: true, keyRevoked: true },
		});
		await expect(verifySignedReceiptTrusted(receipt, () => validKey)).resolves.toMatchObject({
			status: "SIGNER_TRUSTED",
			steps: { hashValid: true, signatureValid: true, signerRecognized: true, keyCurrent: true, keyRevoked: false },
		});
	});

	it("signature is deterministic for same content and key", () => {
		const keyPair = generateReceiptKeyPair();
		const sig1 = signReceipt(content, keyPair.privateKey, keyPair.keyId);
		const sig2 = signReceipt(content, keyPair.privateKey, keyPair.keyId);
		expect(sig1.signature).toBe(sig2.signature);
	});
});
