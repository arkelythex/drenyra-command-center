import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	type KeyTrustResolver,
	type ReceiptContent,
	type ReceiptType,
	type SignedReceipt,
	type SigningKeyInfo,
	verifySignedReceipt as verifyCandidateReceipt,
	verifySignedReceiptTrusted as verifyCandidateReceiptTrusted,
} from "drenyra-ai/receipts";
import { describe, expect, it } from "vitest";
import {
	verifySignedReceipt as verifyFacadeReceipt,
	verifySignedReceiptTrusted as verifyFacadeReceiptTrusted,
} from "../../mission-receipt.js";

const conformanceDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(conformanceDir, "../../../../..");
const vectorsPath = join(
	repoRoot,
	"contracts",
	"receipt-schema",
	"v1",
	"fixtures",
	"conformance-vectors.v1.json",
);

const EXPECTED_VECTOR_COUNT = 8;

interface ReceiptVector {
	name: string;
	receipt: SignedReceipt;
	trustedKeys?: readonly SigningKeyInfo[];
}

interface ReceiptVectorSuite {
	contract: string;
	version: string;
	vectors: readonly ReceiptVector[];
}

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null;
}

function isReceiptType(input: unknown): input is ReceiptType {
	return (
		input === "APPROVAL" ||
		input === "EXECUTION" ||
		input === "COMPLETION" ||
		input === "EXTERNAL_SUBMISSION"
	);
}

function isReceiptContent(input: unknown): input is ReceiptContent {
	return (
		isRecord(input) &&
		typeof input.missionId === "string" &&
		typeof input.companyId === "string" &&
		typeof input.actorId === "string" &&
		(input.decision === "APPROVE" || input.decision === "REJECT") &&
		typeof input.proposalVersion === "number" &&
		Number.isInteger(input.proposalVersion) &&
		typeof input.evidenceHash === "string" &&
		typeof input.previousStatus === "string" &&
		typeof input.newStatus === "string" &&
		typeof input.payloadHash === "string" &&
		typeof input.timestamp === "string"
	);
}

function isSignedReceipt(input: unknown): input is SignedReceipt {
	return (
		isRecord(input) &&
		typeof input.protocolVersion === "string" &&
		isReceiptType(input.receiptType) &&
		input.algorithm === "Ed25519" &&
		isReceiptContent(input.content) &&
		typeof input.receiptHash === "string" &&
		typeof input.signerKeyId === "string" &&
		typeof input.signerPublicKey === "string" &&
		typeof input.signature === "string" &&
		typeof input.issuedAt === "string"
	);
}

function isSigningKeyInfo(input: unknown): input is SigningKeyInfo {
	return (
		isRecord(input) &&
		typeof input.keyId === "string" &&
		typeof input.publicKey === "string" &&
		typeof input.issuedAt === "string" &&
		(input.expiresAt === undefined || typeof input.expiresAt === "string") &&
		(input.revokedAt === undefined || typeof input.revokedAt === "string")
	);
}

function isReceiptVector(input: unknown): input is ReceiptVector {
	return (
		isRecord(input) &&
		typeof input.name === "string" &&
		isSignedReceipt(input.receipt) &&
		(input.trustedKeys === undefined ||
			(Array.isArray(input.trustedKeys) &&
				input.trustedKeys.every(isSigningKeyInfo)))
	);
}

function isReceiptVectorSuite(input: unknown): input is ReceiptVectorSuite {
	return (
		isRecord(input) &&
		input.contract === "receipt-schema" &&
		input.version === "v1" &&
		Array.isArray(input.vectors) &&
		input.vectors.every(isReceiptVector)
	);
}

function loadReceiptVectors(): ReceiptVectorSuite {
	const parsed: unknown = JSON.parse(readFileSync(vectorsPath, "utf-8"));
	if (!isReceiptVectorSuite(parsed)) {
		throw new Error(
			"Canonical receipt vectors do not match the expected shape",
		);
	}
	return parsed;
}

function resolverFor(trustedKeys: readonly SigningKeyInfo[]): KeyTrustResolver {
	return (keyId: string) => trustedKeys.find((key) => key.keyId === keyId);
}

describe("receipt provider parity", () => {
	it("matches candidate and compatibility-facade verification for all canonical vectors", async () => {
		const suite = loadReceiptVectors();
		expect(suite.vectors).toHaveLength(EXPECTED_VECTOR_COUNT);

		for (const vector of suite.vectors) {
			expect(verifyFacadeReceipt(vector.receipt), vector.name).toEqual(
				verifyCandidateReceipt(vector.receipt),
			);

			const trustedKeys = vector.trustedKeys ?? [];
			const candidateTrusted = await verifyCandidateReceiptTrusted(
				vector.receipt,
				resolverFor(trustedKeys),
			);
			const facadeTrusted = await verifyFacadeReceiptTrusted(
				vector.receipt,
				resolverFor(trustedKeys),
			);
			expect(facadeTrusted, vector.name).toEqual(candidateTrusted);
		}
	});
});
