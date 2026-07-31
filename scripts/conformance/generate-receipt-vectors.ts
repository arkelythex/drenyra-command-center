#!/usr/bin/env bun
/**
 * Deterministic generator for contracts/receipt-schema/v1 conformance vectors.
 *
 * Design §4.3 — this maintenance script:
 *   1. requires the dev-keys file to carry classification "TEST-ONLY";
 *   2. reads the legacy signed fixture and asserts its frozen hash and
 *      signature before copying it with additive metadata;
 *   3. derives the completion vector by metadata-only change (design D6);
 *   4. signs fixed dev-key content with Node Ed25519 and fixed issuance times;
 *   5. derives negative cases through deterministic mutations;
 *   6. emits the eight vectors of spec §3.2 in order as stable two-space JSON
 *      with a trailing newline;
 *   7. writes atomically only when explicitly invoked (`bun run ...`).
 *
 * Regeneration with the same inputs MUST reproduce the committed bytes exactly
 * (REQ-VECTOR-002): this file never reads the clock and never uses random
 * material. It is a maintenance command, never a CI step.
 */

import { readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ReceiptType } from "@drenyra/mission-protocol";
import {
	generateReceiptHash,
	signReceipt,
	type ReceiptContent,
	type SignedReceipt,
	type SigningKeyInfo,
} from "@drenyra/mission-domain";

export interface GenerationInputs {
	legacyFixturePath: string;
	devKeysPath: string;
}

const FROZEN_RECEIPT_HASH =
	"250df62bbfcf3f1b6b54641b45da81ca50fbf679e93ee50f75939e75c7eaee59";
const FROZEN_SIGNATURE =
	"6qJNe5ABgid13vr3tRceW6/YgYB6BCF8UyMSS2rbk9Z8neD3DmpcKCYy7PiMdjX0wuhVAVi8HDmbKJ8nNBaBCw==";

/** Fixed issuance time for every dev-key vector receipt. */
const DEV_ISSUED_AT = "2026-08-01T00:00:00Z";
/** Fixed issuance time for every trusted key (past, so keys are current). */
const KEY_ISSUED_AT = "2026-01-01T00:00:00Z";

interface DevKeyRecord {
	keyId: string;
	publicKey: string;
	privateKey: string;
	issuedAt: string;
	expiresAt?: string;
	revokedAt?: string;
}

function loadJson(path: string): unknown {
	try {
		return JSON.parse(readFileSync(path, "utf-8")) as unknown;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`cannot read or parse ${path}: ${reason}`);
	}
}

function requireRecord(input: unknown, label: string): Record<string, unknown> {
	if (typeof input !== "object" || input === null || Array.isArray(input)) {
		throw new Error(`${label} must be a JSON object`);
	}
	return input as Record<string, unknown>;
}

function requireStringField(
	record: Record<string, unknown>,
	field: string,
	label: string,
): string {
	const candidate = record[field];
	if (typeof candidate !== "string" || candidate.length === 0) {
		throw new Error(`${label} must declare a non-empty string "${field}"`);
	}
	return candidate;
}

function optionalStringField(
	record: Record<string, unknown>,
	field: string,
): string | undefined {
	const candidate = record[field];
	return typeof candidate === "string" ? candidate : undefined;
}

function loadDevKeys(path: string): Map<string, DevKeyRecord> {
	const file = requireRecord(loadJson(path), "dev-keys file");
	const classification = requireStringField(
		file,
		"classification",
		"dev-keys file",
	);
	if (classification !== "TEST-ONLY") {
		throw new Error(
			"dev-keys file MUST carry classification TEST-ONLY; refusing to generate with operational keys",
		);
	}
	const entries = file.keys;
	if (!Array.isArray(entries)) {
		throw new Error('dev-keys file MUST declare a "keys" array');
	}
	const keys = new Map<string, DevKeyRecord>();
	for (const entry of entries) {
		const record = requireRecord(entry, "dev key");
		const keyId = requireStringField(record, "keyId", "dev key");
		if (keys.has(keyId)) {
			throw new Error(`duplicate dev key ${keyId}`);
		}
		keys.set(keyId, {
			keyId,
			publicKey: requireStringField(record, "publicKey", `dev key ${keyId}`),
			privateKey: requireStringField(record, "privateKey", `dev key ${keyId}`),
			issuedAt: requireStringField(record, "issuedAt", `dev key ${keyId}`),
			expiresAt: optionalStringField(record, "expiresAt"),
			revokedAt: optionalStringField(record, "revokedAt"),
		});
	}
	return keys;
}

function loadLegacySignedReceipt(path: string): SignedReceipt {
	const raw = loadJson(path);
	const record = requireRecord(raw, "legacy signed fixture");
	const declaredHash = requireStringField(record, "receiptHash", "legacy signed fixture");
	const declaredSignature = requireStringField(record, "signature", "legacy signed fixture");
	if (declaredHash !== FROZEN_RECEIPT_HASH) {
		throw new Error(
			`frozen receiptHash mismatch in ${path}: expected ${FROZEN_RECEIPT_HASH}, found ${declaredHash}`,
		);
	}
	if (declaredSignature !== FROZEN_SIGNATURE) {
		throw new Error(
			`frozen signature mismatch in ${path}: expected ${FROZEN_SIGNATURE}, found ${declaredSignature}`,
		);
	}
	return raw as SignedReceipt;
}

function requireKey(keys: Map<string, DevKeyRecord>, keyId: string): DevKeyRecord {
	const key = keys.get(keyId);
	if (key === undefined) {
		throw new Error(`dev key ${keyId} not found in the dev-keys file`);
	}
	return key;
}

function legacyTrustedKey(legacy: SignedReceipt): SigningKeyInfo {
	return {
		keyId: legacy.signerKeyId,
		publicKey: legacy.signerPublicKey,
		issuedAt: KEY_ISSUED_AT,
	};
}

function devTrustedKey(key: DevKeyRecord): SigningKeyInfo {
	const info: SigningKeyInfo = {
		keyId: key.keyId,
		publicKey: key.publicKey,
		issuedAt: key.issuedAt,
	};
	if (key.expiresAt !== undefined) {
		info.expiresAt = key.expiresAt;
	}
	if (key.revokedAt !== undefined) {
		info.revokedAt = key.revokedAt;
	}
	return info;
}

function devContent(missionId: string): ReceiptContent {
	return {
		missionId,
		companyId: "cmp_dev_001",
		actorId: "user_dev_001",
		decision: "APPROVE",
		proposalVersion: 3,
		evidenceHash: "c0ffee01",
		previousStatus: "AWAITING_APPROVAL",
		newStatus: "APPROVED",
		payloadHash: "c0ffee02",
		timestamp: DEV_ISSUED_AT,
	};
}

function buildDevReceipt(
	content: ReceiptContent,
	key: DevKeyRecord,
	receiptType: ReceiptType,
): SignedReceipt {
	const receiptHash = generateReceiptHash(content);
	const { signature } = signReceipt(content, key.privateKey, key.keyId);
	return {
		protocolVersion: "1.0",
		receiptType,
		algorithm: "Ed25519",
		content,
		receiptHash,
		signerKeyId: key.keyId,
		signerPublicKey: key.publicKey,
		signature,
		issuedAt: DEV_ISSUED_AT,
	};
}

/**
 * Flip a deterministic byte of the 64-byte Ed25519 signature. The mutated
 * output remains valid base64 of 64 bytes, so it passes schema validation and
 * fails cryptographic verification (spec §4.1).
 */
function mutateSignature(signatureBase64: string): string {
	const bytes = Buffer.from(signatureBase64, "base64");
	const lastIndex = bytes.length - 1;
	if (lastIndex < 0) {
		throw new Error("cannot mutate an empty signature");
	}
	bytes[lastIndex] = bytes.readUInt8(lastIndex) ^ 0x01;
	return bytes.toString("base64");
}

interface VectorMeta {
	receiptHash: string;
	signatureValid: boolean;
	status: string;
}

function vector(
	name: string,
	description: string,
	receipt: SignedReceipt,
	meta: VectorMeta,
	trustedKeys?: SigningKeyInfo[],
): Record<string, unknown> {
	const entry: Record<string, unknown> = {
		name,
		description,
		receipt,
		vectors: meta,
	};
	if (trustedKeys !== undefined) {
		entry.trustedKeys = trustedKeys;
	}
	return entry;
}

function assembleVectors(
	legacy: SignedReceipt,
	devKeys: Map<string, DevKeyRecord>,
): Record<string, unknown> {
	const keyDev001 = requireKey(devKeys, "key_dev_001");
	const keyDev002 = requireKey(devKeys, "key_dev_002");
	const keyDev003 = requireKey(devKeys, "key_dev_003");

	const approvalTrusted = [legacyTrustedKey(legacy)];
	const completion = { ...legacy, receiptType: ReceiptType.COMPLETION };
	const tamperedContent: ReceiptContent = {
		...legacy.content,
		evidenceHash: "b1b2b3b4b5",
	};
	const wrongSigner = {
		...legacy,
		signerKeyId: keyDev001.keyId,
		signerPublicKey: keyDev001.publicKey,
	};

	const unknownSignerReceipt = buildDevReceipt(
		devContent("mis_vec_unknown_signer"),
		keyDev001,
		ReceiptType.APPROVAL,
	);
	const expiredReceipt = buildDevReceipt(
		devContent("mis_vec_key_expired"),
		keyDev002,
		ReceiptType.APPROVAL,
	);
	const revokedReceipt = buildDevReceipt(
		devContent("mis_vec_key_revoked"),
		keyDev003,
		ReceiptType.APPROVAL,
	);

	const vectors = [
		vector(
			"receipt-valid-approval",
			"Valid signed receipt, trusted signer key present",
			legacy,
			{ receiptHash: FROZEN_RECEIPT_HASH, signatureValid: true, status: "SIGNER_TRUSTED" },
			approvalTrusted,
		),
		vector(
			"receipt-valid-completion",
			"receiptType COMPLETION changes nothing in the hash — metadata excluded from hashing",
			completion,
			{ receiptHash: FROZEN_RECEIPT_HASH, signatureValid: true, status: "SIGNER_TRUSTED" },
			approvalTrusted,
		),
		vector(
			"receipt-tampered-hash",
			"Content mutated after signing (evidenceHash), stale receiptHash",
			{ ...legacy, content: tamperedContent },
			{ receiptHash: FROZEN_RECEIPT_HASH, signatureValid: false, status: "PAYLOAD_TAMPERED" },
		),
		vector(
			"receipt-invalid-signature",
			"Content/hash intact, signature bytes garbled",
			{ ...legacy, signature: mutateSignature(FROZEN_SIGNATURE) },
			{ receiptHash: FROZEN_RECEIPT_HASH, signatureValid: false, status: "CONTENT_VALID" },
		),
		vector(
			"receipt-wrong-signer",
			"Hash intact, signature fails against replaced public key",
			wrongSigner,
			{ receiptHash: FROZEN_RECEIPT_HASH, signatureValid: false, status: "CONTENT_VALID" },
		),
		vector(
			"receipt-unknown-signer",
			"Hash+sig valid; trustedKeys does not contain the signer",
			unknownSignerReceipt,
			{
				receiptHash: generateReceiptHash(unknownSignerReceipt.content),
				signatureValid: true,
				status: "UNKNOWN_SIGNER",
			},
			approvalTrusted,
		),
		vector(
			"receipt-key-expired",
			"Trusted key lifecycle expiry",
			expiredReceipt,
			{
				receiptHash: generateReceiptHash(expiredReceipt.content),
				signatureValid: true,
				status: "KEY_EXPIRED",
			},
			[devTrustedKey(keyDev002)],
		),
		vector(
			"receipt-key-revoked",
			"Trusted key revocation",
			revokedReceipt,
			{
				receiptHash: generateReceiptHash(revokedReceipt.content),
				signatureValid: true,
				status: "KEY_REVOKED",
			},
			[devTrustedKey(keyDev003)],
		),
	];

	return {
		contract: "receipt-schema",
		version: "v1",
		vectors,
	};
}

/**
 * Generate the canonical vector suite bytes in memory. Never writes files;
 * returns stable two-space JSON with a trailing newline.
 */
export function generateConformanceVectors(inputs: GenerationInputs): string {
	const legacy = loadLegacySignedReceipt(inputs.legacyFixturePath);
	const devKeys = loadDevKeys(inputs.devKeysPath);
	const suite = assembleVectors(legacy, devKeys);
	return JSON.stringify(suite, null, 2) + "\n";
}

function writeAtomic(filePath: string, content: string): void {
	const targetDir = dirname(filePath);
	const tempPath = join(targetDir, `.${basename(filePath)}.tmp-${process.pid}`);
	writeFileSync(tempPath, content, "utf-8");
	try {
		renameSync(tempPath, filePath);
	} catch (error) {
		rmSync(tempPath, { force: true });
		throw error;
	}
}

if (import.meta.main) {
	const scriptDir = dirname(fileURLToPath(import.meta.url));
	const repoRoot = resolve(scriptDir, "../..");
	const outputPath = join(
		repoRoot,
		"contracts",
		"receipt-schema",
		"v1",
		"fixtures",
		"conformance-vectors.v1.json",
	);
	const legacyFixturePath = join(
		repoRoot,
		"fixtures",
		"receipts",
		"receipt-signed-valid.v1.json",
	);
	const devKeysPath = join(
		repoRoot,
		"contracts",
		"receipt-schema",
		"v1",
		"fixtures",
		"dev-keys.test-only.json",
	);
	const bytes = generateConformanceVectors({ legacyFixturePath, devKeysPath });
	writeAtomic(outputPath, bytes);
	console.log(`wrote ${outputPath}`);
}
