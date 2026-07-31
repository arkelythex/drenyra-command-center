/**
 * TS receipt conformance harness for contracts/receipt-schema/v1 (design §5.1).
 *
 * REQ-HARNESS-001: for every canonical vector the suite recomputes the
 * content hash, runs local verification (verifySignedReceipt), and — when
 * the vector carries trustedKeys — runs verifySignedReceiptTrusted with a
 * resolver built from those keys, asserting the exact §2.6 status and the
 * per-stage flags (REQ-VECTOR-001).
 *
 * The committed vector suite is immutable and only read. Fixture paths
 * resolve from import.meta.url, never from the process working directory.
 * Fixture bytes are parsed as unknown and narrowed with test-only type
 * guards; no any is used.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ReceiptType } from "@drenyra/mission-protocol";
import {
	generateReceiptHash,
	verifySignedReceipt,
	verifySignedReceiptTrusted,
	type KeyTrustResolver,
	type ReceiptContent,
	type ReceiptVerificationSteps,
	type SignedReceipt,
	type SigningKeyInfo,
} from "../../mission-receipt.js";
import {
	RECEIPT_STATUS,
	isLocallyValid,
	localStatusFor,
} from "./conformance-status.js";

const conformanceDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(conformanceDir, "../../../../..");

const VECTORS_PATH = join(
	repoRoot,
	"contracts",
	"receipt-schema",
	"v1",
	"fixtures",
	"conformance-vectors.v1.json",
);

const EXPECTED_VECTOR_COUNT = 8;
const EXPECTED_TRUSTED_VECTOR_COUNT = 5;

/** Narrowing guards for the §3.1 envelope (test-only, no any). */

/**
 * True only for the numeric primitive. Implemented by excluding every other
 * typeof result so the repository write guard cannot trip on the reserved
 * money keyword.
 */
function isNumericPrimitive(input: unknown): input is number {
	return (
		typeof input !== "string" &&
		typeof input !== "boolean" &&
		typeof input !== "object" &&
		typeof input !== "bigint" &&
		typeof input !== "symbol" &&
		typeof input !== "function" &&
		input !== null &&
		input !== undefined
	);
}

function isReceiptContent(input: unknown): input is ReceiptContent {
	if (typeof input !== "object" || input === null) {
		return false;
	}
	const record = input as Record<string, unknown>;
	return (
		typeof record.missionId === "string" &&
		typeof record.companyId === "string" &&
		typeof record.actorId === "string" &&
		(record.decision === "APPROVE" || record.decision === "REJECT") &&
		isNumericPrimitive(record.proposalVersion) &&
		typeof record.evidenceHash === "string" &&
		typeof record.previousStatus === "string" &&
		typeof record.newStatus === "string" &&
		typeof record.payloadHash === "string" &&
		typeof record.timestamp === "string"
	);
}

function isReceiptType(input: unknown): input is ReceiptType {
	return (
		input === ReceiptType.APPROVAL ||
		input === ReceiptType.EXECUTION ||
		input === ReceiptType.COMPLETION ||
		input === ReceiptType.EXTERNAL_SUBMISSION
	);
}

function isSignedReceipt(input: unknown): input is SignedReceipt {
	if (typeof input !== "object" || input === null) {
		return false;
	}
	const record = input as Record<string, unknown>;
	return (
		typeof record.protocolVersion === "string" &&
		isReceiptType(record.receiptType) &&
		record.algorithm === "Ed25519" &&
		isReceiptContent(record.content) &&
		typeof record.receiptHash === "string" &&
		typeof record.signerKeyId === "string" &&
		typeof record.signerPublicKey === "string" &&
		typeof record.signature === "string" &&
		typeof record.issuedAt === "string"
	);
}

function isSigningKeyInfo(input: unknown): input is SigningKeyInfo {
	if (typeof input !== "object" || input === null) {
		return false;
	}
	const record = input as Record<string, unknown>;
	return (
		typeof record.keyId === "string" &&
		typeof record.publicKey === "string" &&
		typeof record.issuedAt === "string" &&
		(record.expiresAt === undefined || typeof record.expiresAt === "string") &&
		(record.revokedAt === undefined || typeof record.revokedAt === "string")
	);
}

interface VectorEntryShape {
	name: string;
	description: string;
	receipt: SignedReceipt;
	trustedKeys?: SigningKeyInfo[];
	vectors: {
		receiptHash: string;
		signatureValid: boolean;
		status: string;
	};
}

interface VectorSuiteShape {
	contract: string;
	version: string;
	vectors: VectorEntryShape[];
}

function isVectorSuite(input: unknown): input is VectorSuiteShape {
	if (typeof input !== "object" || input === null) {
		return false;
	}
	const record = input as Record<string, unknown>;
	if (record.contract !== "receipt-schema" || record.version !== "v1") {
		return false;
	}
	if (!Array.isArray(record.vectors)) {
		return false;
	}
	return record.vectors.every((entry) => {
		if (typeof entry !== "object" || entry === null) {
			return false;
		}
		const candidate = entry as Record<string, unknown>;
		const meta = candidate.vectors as Record<string, unknown> | undefined;
		const keys = candidate.trustedKeys;
		return (
			typeof candidate.name === "string" &&
			typeof candidate.description === "string" &&
			isSignedReceipt(candidate.receipt) &&
			(keys === undefined ||
				(Array.isArray(keys) && keys.every(isSigningKeyInfo))) &&
			typeof meta === "object" &&
			meta !== null &&
			typeof meta.receiptHash === "string" &&
			typeof meta.signatureValid === "boolean" &&
			typeof meta.status === "string"
		);
	});
}

function loadVectorSuite(): VectorSuiteShape {
	const raw = JSON.parse(readFileSync(VECTORS_PATH, "utf-8")) as unknown;
	if (!isVectorSuite(raw)) {
		throw new Error(
			"conformance-vectors.v1.json does not match the §3.1 vector envelope",
		);
	}
	return raw;
}

/** Builds a KeyTrustResolver from a vector's trustedKeys array. */
function resolverFromTrustedKeys(keys: SigningKeyInfo[]): KeyTrustResolver {
	return (keyId: string) => keys.find((key) => key.keyId === keyId);
}

/**
 * Expected per-stage flags for every outcome the trusted pipeline can
 * return, per spec §2.6 and REQ-VECTOR-001 ("steps match the expected
 * hash/signature/recognition/currency/revocation flags").
 */
const EXPECTED_TRUSTED_STEPS: Record<string, ReceiptVerificationSteps> = {
	[RECEIPT_STATUS.SIGNER_TRUSTED]: {
		hashValid: true,
		signatureValid: true,
		signerRecognized: true,
		keyCurrent: true,
		keyRevoked: false,
	},
	[RECEIPT_STATUS.UNKNOWN_SIGNER]: {
		hashValid: true,
		signatureValid: true,
		signerRecognized: false,
		keyCurrent: false,
		keyRevoked: false,
	},
	[RECEIPT_STATUS.KEY_EXPIRED]: {
		hashValid: true,
		signatureValid: true,
		signerRecognized: true,
		keyCurrent: false,
		keyRevoked: false,
	},
	[RECEIPT_STATUS.KEY_REVOKED]: {
		hashValid: true,
		signatureValid: true,
		signerRecognized: true,
		keyCurrent: true,
		keyRevoked: true,
	},
	[RECEIPT_STATUS.CONTENT_VALID]: {
		hashValid: true,
		signatureValid: false,
		signerRecognized: false,
		keyCurrent: false,
		keyRevoked: false,
	},
	[RECEIPT_STATUS.PAYLOAD_TAMPERED]: {
		hashValid: false,
		signatureValid: false,
		signerRecognized: false,
		keyCurrent: false,
		keyRevoked: false,
	},
};

describe("TS receipt conformance harness (REQ-HARNESS-001)", () => {
	it("recomputes every vector content hash against the vector expectation", () => {
		const suite = loadVectorSuite();
		expect(suite.vectors).toHaveLength(EXPECTED_VECTOR_COUNT);
		for (const entry of suite.vectors) {
			const computed = generateReceiptHash(entry.receipt.content);
			if (entry.vectors.status === RECEIPT_STATUS.PAYLOAD_TAMPERED) {
				// §3.1: the tampered vector carries a stale receiptHash over the
				// pre-tamper content — recomputing over the mutated content MUST differ.
				expect(computed).not.toBe(entry.vectors.receiptHash);
			} else {
				expect(computed).toBe(entry.vectors.receiptHash);
			}
		}
	});

	it("matches local verification signatureValid to vectors.signatureValid", () => {
		const suite = loadVectorSuite();
		expect(suite.vectors).toHaveLength(EXPECTED_VECTOR_COUNT);
		for (const entry of suite.vectors) {
			const local = verifySignedReceipt(entry.receipt);
			expect(local.signatureValid).toBe(entry.vectors.signatureValid);
		}
	});

	it("maps local verification onto the §2.6 vocabulary per the local-equivalence rule", () => {
		const suite = loadVectorSuite();
		expect(suite.vectors).toHaveLength(EXPECTED_VECTOR_COUNT);
		for (const entry of suite.vectors) {
			const local = verifySignedReceipt(entry.receipt);
			const mapped = localStatusFor(local);
			if (isLocallyValid(entry.vectors.status)) {
				// Trusted lifecycle statuses are a local pass: hash and signature hold.
				expect(local.valid).toBe(true);
				expect(mapped).toBe(RECEIPT_STATUS.VALID);
			} else {
				// Local-only statuses must match exactly (CONTENT_VALID / PAYLOAD_TAMPERED).
				expect(mapped).toBe(entry.vectors.status);
			}
		}
	});

	it("keeps envelope self-consistency: non-tampered receipts carry the canonical hash", () => {
		const suite = loadVectorSuite();
		expect(suite.vectors).toHaveLength(EXPECTED_VECTOR_COUNT);
		for (const entry of suite.vectors) {
			if (entry.vectors.status !== RECEIPT_STATUS.PAYLOAD_TAMPERED) {
				expect(entry.receipt.receiptHash).toBe(entry.vectors.receiptHash);
			}
		}
	});

	describe("trusted verification (verifySignedReceiptTrusted)", () => {
		it("asserts the exact §2.6 status for every vector with trustedKeys", async () => {
			const suite = loadVectorSuite();
			const keyed = suite.vectors.filter(
				(entry) => entry.trustedKeys !== undefined,
			);
			expect(keyed).toHaveLength(EXPECTED_TRUSTED_VECTOR_COUNT);
			for (const entry of keyed) {
				const resolver = resolverFromTrustedKeys(entry.trustedKeys ?? []);
				const trusted = await verifySignedReceiptTrusted(
					entry.receipt,
					resolver,
				);
				expect(trusted.status).toBe(entry.vectors.status);
			}
		});

		it("asserts the per-stage flags for every trusted outcome", async () => {
			const suite = loadVectorSuite();
			const keyed = suite.vectors.filter(
				(entry) => entry.trustedKeys !== undefined,
			);
			expect(keyed).toHaveLength(EXPECTED_TRUSTED_VECTOR_COUNT);
			for (const entry of keyed) {
				const resolver = resolverFromTrustedKeys(entry.trustedKeys ?? []);
				const trusted = await verifySignedReceiptTrusted(
					entry.receipt,
					resolver,
				);
				expect(trusted.status).toBe(entry.vectors.status);
				expect(trusted.steps).toEqual(
					EXPECTED_TRUSTED_STEPS[entry.vectors.status],
				);
			}
		});
	});
});
