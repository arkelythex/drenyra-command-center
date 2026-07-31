/**
 * Deterministic vector generation for contracts/receipt-schema/v1 (design §4.3).
 *
 * REQ-VECTOR-002: regeneration with the same fixed inputs MUST be byte-identical
 * because Ed25519 signing is deterministic and every timestamp is fixed (never
 * `new Date()`). T4 covers two in-memory runs, the frozen legacy hash/signature
 * surviving into vector #1, and the D6 metadata-only completion vector.
 *
 * All paths resolve from import.meta.url so the suite runs regardless of the
 * process working directory. The generator is invoked in memory only — this
 * test never writes files.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateConformanceVectors } from "../../../../../scripts/conformance/generate-receipt-vectors.js";

const conformanceDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(conformanceDir, "../../../../..");

const LEGACY_FIXTURE_PATH = join(
	repoRoot,
	"fixtures",
	"receipts",
	"receipt-signed-valid.v1.json",
);
const VECTORS_PATH = join(
	repoRoot,
	"contracts",
	"receipt-schema",
	"v1",
	"fixtures",
	"conformance-vectors.v1.json",
);
const DEV_KEYS_PATH = join(
	repoRoot,
	"contracts",
	"receipt-schema",
	"v1",
	"fixtures",
	"dev-keys.test-only.json",
);

const EXPECTED_VECTOR_NAMES = [
	"receipt-valid-approval",
	"receipt-valid-completion",
	"receipt-tampered-hash",
	"receipt-invalid-signature",
	"receipt-wrong-signer",
	"receipt-unknown-signer",
	"receipt-key-expired",
	"receipt-key-revoked",
] as const;

const STATUS_VOCABULARY = new Set([
	"SIGNER_TRUSTED",
	"VALID",
	"UNKNOWN_SIGNER",
	"KEY_EXPIRED",
	"KEY_REVOKED",
	"CONTENT_VALID",
	"PAYLOAD_TAMPERED",
]);

const FROZEN_RECEIPT_HASH =
	"250df62bbfcf3f1b6b54641b45da81ca50fbf679e93ee50f75939e75c7eaee59";
const FROZEN_SIGNATURE =
	"6qJNe5ABgid13vr3tRceW6/YgYB6BCF8UyMSS2rbk9Z8neD3DmpcKCYy7PiMdjX0wuhVAVi8HDmbKJ8nNBaBCw==";

/** Minimal structural shape of the committed vector suite (spec §3.1). */
interface VectorEntryShape {
	name: string;
	description: string;
	receipt: {
		protocolVersion: string;
		receiptType: string;
		algorithm: string;
		content: Record<string, unknown>;
		receiptHash: string;
		signerKeyId: string;
		signerPublicKey: string;
		signature: string;
		issuedAt: string;
	};
	trustedKeys?: Array<{ keyId: string }>;
	vectors: { receiptHash: string; signatureValid: boolean; status: string };
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
		const receipt = candidate.receipt as Record<string, unknown> | undefined;
		const meta = candidate.vectors as Record<string, unknown> | undefined;
		return (
			typeof candidate.name === "string" &&
			typeof candidate.description === "string" &&
			typeof receipt === "object" &&
			receipt !== null &&
			typeof receipt.receiptHash === "string" &&
			typeof receipt.signature === "string" &&
			typeof receipt.receiptType === "string" &&
			typeof receipt.content === "object" &&
			receipt.content !== null &&
			typeof meta === "object" &&
			meta !== null &&
			typeof meta.receiptHash === "string" &&
			typeof meta.signatureValid === "boolean" &&
			typeof meta.status === "string"
		);
	});
}

function loadVectorSuite(bytes: string): VectorSuiteShape {
	const parsed = JSON.parse(bytes) as unknown;
	if (!isVectorSuite(parsed)) {
		throw new Error("generator output does not match the §3.1 vector envelope");
	}
	return parsed;
}

function runGenerator(): string {
	return generateConformanceVectors({
		legacyFixturePath: LEGACY_FIXTURE_PATH,
		devKeysPath: DEV_KEYS_PATH,
	});
}

function vectorByName(
	suite: VectorSuiteShape,
	name: string,
): VectorEntryShape {
	const found = suite.vectors.find((entry) => entry.name === name);
	if (found === undefined) {
		throw new Error(`vector ${name} missing from generated suite`);
	}
	return found;
}

describe("canonical vector generation (deterministic, design §4.3)", () => {
	it("produces byte-identical vectors across two in-memory runs", () => {
		const first = runGenerator();
		const second = runGenerator();
		expect(first).toBe(second);
	});

	it("preserves the frozen legacy hash, signature, and full bundle in vector #1", () => {
		const legacy = JSON.parse(readFileSync(LEGACY_FIXTURE_PATH, "utf-8")) as unknown;
		const approval = vectorByName(loadVectorSuite(runGenerator()), "receipt-valid-approval");

		expect(approval.receipt.receiptHash).toBe(FROZEN_RECEIPT_HASH);
		expect(approval.receipt.signature).toBe(FROZEN_SIGNATURE);
		expect(approval.vectors.receiptHash).toBe(FROZEN_RECEIPT_HASH);
		expect(approval.vectors.signatureValid).toBe(true);
		expect(approval.vectors.status).toBe("SIGNER_TRUSTED");
		expect(approval.receipt).toEqual(legacy);
	});

	it("keeps completion content byte-identical to approval content (metadata-only change, D6)", () => {
		const suite = loadVectorSuite(runGenerator());
		const approval = vectorByName(suite, "receipt-valid-approval");
		const completion = vectorByName(suite, "receipt-valid-completion");

		expect(completion.receipt.receiptType).toBe("COMPLETION");
		expect(completion.receipt.content).toEqual(approval.receipt.content);
		expect(completion.receipt.receiptHash).toBe(approval.receipt.receiptHash);
		expect(completion.receipt.signature).toBe(approval.receipt.signature);
		expect(completion.vectors.receiptHash).toBe(FROZEN_RECEIPT_HASH);
		expect(completion.vectors.status).toBe("SIGNER_TRUSTED");
	});

	describe("committed suite drift guard (T7)", () => {
		it("regenerates the committed bytes exactly (never mutates the fixture)", () => {
			const committed = readFileSync(VECTORS_PATH, "utf-8");
			const regenerated = runGenerator();
			expect(regenerated).toBe(committed);
		});

		it("emits exactly the eight required vectors in spec §3.2 order", () => {
			const suite = loadVectorSuite(runGenerator());
			expect(suite.vectors.map((entry) => entry.name)).toEqual([
				...EXPECTED_VECTOR_NAMES,
			]);
		});

		it("labels every vector with a status from the §2.6 vocabulary", () => {
			const suite = loadVectorSuite(runGenerator());
			expect(suite.vectors).toHaveLength(EXPECTED_VECTOR_NAMES.length);
			for (const entry of suite.vectors) {
				expect(STATUS_VOCABULARY.has(entry.vectors.status)).toBe(true);
			}
		});
	});
});
