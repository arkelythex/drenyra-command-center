/**
 * ledger-core tests — design §6 rev.2 (PR6 ledger foundation).
 *
 * Covers §6.3 entryTypes vocabulary, §6.4 identity, §6.5 canonical hash chain,
 * §6.6 optimistic append + idempotency, §6.7 genesis, §6.8 structured
 * validation (collects every finding, never stops at the first error),
 * §6.10 signing policy (hash-only vs signed), §6.12 rejection conditions.
 */
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import {
	EMPTY_HASH,
	ENTRY_TYPE,
	appendEntry,
	computeEntryHash,
	createGenesisEntry,
	createLedgerEntry,
	extractTrustRootKeys,
	signEntry,
	sortedStringify,
	validateLedger,
	verifyEntrySignature,
} from "../ledger-core";

import type { LedgerEntry, LedgerManifest } from "../ledger-core";

const LEDGER_ID = "main";
const ACTOR = "test-actor";
const SCHEMA_VERSION = "1.0";
const OCCURRED_AT = "2026-08-01T00:00:00Z";
const RECORDED_AT = "2026-08-01T00:00:01Z";

const MANIFEST: LedgerManifest = {
	protocolVersion: "1.0",
	hashAlgorithm: "SHA-256",
	trustRoot: { keyIds: [] },
	jurisdiction: "PE",
	createdAt: OCCURRED_AT,
	signingPolicy: { required: false, algorithm: "Ed25519", keyIds: [] },
	manifest: { name: "main" },
};

function sha256Of(data: string): string {
	return createHash("sha256").update(data, "utf-8").digest("hex");
}

function must<T>(item: T | undefined, label: string): T {
	if (item === undefined) throw new TypeError(`missing ${label}`);
	return item;
}

function makeGenesis(manifest: LedgerManifest = MANIFEST): LedgerEntry {
	return createGenesisEntry({
		ledgerId: LEDGER_ID,
		manifest,
		actor: ACTOR,
		occurredAt: OCCURRED_AT,
		recordedAt: RECORDED_AT,
		entryId: randomUUID(),
	});
}

interface EntryOverrides {
	entryType?: string;
	payload?: Record<string, unknown>;
	receipt?: unknown;
	receiptId?: string;
	idempotencyKey?: string;
	entryId?: string;
	actor?: string;
	occurredAt?: string;
	recordedAt?: string;
}

function makeEntry(
	head: LedgerEntry,
	overrides: EntryOverrides = {},
): LedgerEntry {
	return createLedgerEntry({
		ledgerId: LEDGER_ID,
		entryType: overrides.entryType ?? ENTRY_TYPE.CHECKPOINT_CREATED,
		actor: overrides.actor ?? ACTOR,
		occurredAt: overrides.occurredAt ?? OCCURRED_AT,
		recordedAt: overrides.recordedAt ?? RECORDED_AT,
		entryId: overrides.entryId ?? randomUUID(),
		head,
		payload: overrides.payload,
		receipt: overrides.receipt,
		receiptId: overrides.receiptId,
		idempotencyKey: overrides.idempotencyKey,
	});
}

function toLines(...entries: readonly LedgerEntry[]): string[] {
	return entries.map((entry) => sortedStringify(entry));
}

function receiptRecordedEntry(
	head: LedgerEntry,
	receiptId: string,
	receipt: unknown,
): LedgerEntry {
	return makeEntry(head, {
		entryType: ENTRY_TYPE.RECEIPT_RECORDED,
		receipt,
		receiptId,
		idempotencyKey: receiptId,
	});
}

describe("genesis (§6.7)", () => {
	it("creates a genesis entry fixing protocol, trust, jurisdiction and policy", () => {
		const genesis = makeGenesis();
		expect(genesis.entryType).toBe(ENTRY_TYPE.GENESIS);
		expect(genesis.sequence).toBe(1);
		expect(genesis.previousEntryHash).toBe(EMPTY_HASH);
		expect(genesis.receiptHash).toBe(EMPTY_HASH);
		expect(genesis.signerKeyId).toBe("hash-only");
		expect(genesis.schemaVersion).toBe(SCHEMA_VERSION);
		expect(genesis.payload).toEqual(MANIFEST);
	});

	it("defines the canonical empty-string SHA-256 as the genesis previous hash", () => {
		expect(EMPTY_HASH).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
		expect(sha256Of("")).toBe(EMPTY_HASH);
	});

	it("binds the genesis payloadHash to the canonical serialization of the manifest", () => {
		const genesis = makeGenesis();
		expect(genesis.payloadHash).toBe(sha256Of(sortedStringify(MANIFEST)));
		expect(genesis.payloadHash).not.toBe(EMPTY_HASH);
	});
});

describe("canonical serialization (§6.5, shared with receipt conformance)", () => {
	it("serializes compact with sorted keys at every nesting level", () => {
		expect(sortedStringify({ b: 1, a: { d: 4, c: 3 } })).toBe(
			'{"a":{"c":3,"d":4},"b":1}',
		);
		expect(sortedStringify({ z: [2, 1] })).toBe('{"z":[2,1]}');
	});

	it("never depends on pretty-print: reparsing and re-serializing yields the same hash", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const reparsed = JSON.parse(sortedStringify(entry)) as LedgerEntry;
		expect(computeEntryHash(reparsed)).toBe(computeEntryHash(entry));
	});
});

describe("hash chain (§6.5)", () => {
	it("computes entryHash = H(canonicalHeader || payloadHash || receiptHash || previousEntryHash)", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const header = sortedStringify({
			ledgerId: entry.ledgerId,
			sequence: entry.sequence,
			entryType: entry.entryType,
			occurredAt: entry.occurredAt,
			recordedAt: entry.recordedAt,
			actor: entry.actor,
			schemaVersion: entry.schemaVersion,
			entryId: entry.entryId,
		});
		const expected = sha256Of(
			header + entry.payloadHash + entry.receiptHash + entry.previousEntryHash,
		);
		expect(computeEntryHash(entry)).toBe(expected);
	});

	it("links each entry to its predecessor by hash", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		expect(entry.previousEntryHash).toBe(computeEntryHash(genesis));
		expect(entry.sequence).toBe(2);
	});

	it("uses monotonic integer sequence, never a timestamp", () => {
		const genesis = makeGenesis();
		const first = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const second = makeEntry(first, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: first.entryId },
		});
		expect(first.sequence).toBe(2);
		expect(second.sequence).toBe(3);
		expect(second.sequence - first.sequence).toBe(1);
		expect(second.sequence % 1).toBe(0);
	});
});

describe("append (§6.6)", () => {
	it("appends a linked entry when head and sequence match", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const result = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: computeEntryHash(genesis),
			expectedSequence: 2,
			entry,
			chain: [genesis],
		});
		expect(result.status).toBe("appended");
		if (result.status === "appended") {
			expect(result.entryHash).toBe(computeEntryHash(entry));
		}
	});

	it("detects two writers appending on the same head (head-conflict)", () => {
		const genesis = makeGenesis();
		const writerA = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const writerB = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const headHash = computeEntryHash(genesis);
		const first = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: headHash,
			expectedSequence: 2,
			entry: writerA,
			chain: [genesis],
		});
		expect(first.status).toBe("appended");
		const second = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: headHash,
			expectedSequence: 2,
			entry: writerB,
			chain: [genesis, writerA],
		});
		expect(second.status).toBe("head-conflict");
		if (second.status === "head-conflict") {
			expect(second.actualHeadHash).toBe(computeEntryHash(writerA));
			expect(second.actualSequence).toBe(3);
		}
	});

	it("rejects an entry built against a stale head (expected mismatch)", () => {
		const genesis = makeGenesis();
		const committed = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const stale = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const result = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: computeEntryHash(genesis),
			expectedSequence: 2,
			entry: stale,
			chain: [genesis, committed],
		});
		expect(result.status).toBe("head-conflict");
	});

	it("rejects appends against an empty chain (genesis missing)", () => {
		const genesis = makeGenesis();
		const result = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: EMPTY_HASH,
			expectedSequence: 1,
			entry: genesis,
			chain: [],
		});
		expect(result.status).toBe("invalid-chain");
		if (result.status === "invalid-chain") {
			expect(result.findings[0]?.code).toBe("genesis");
		}
	});
});

describe("idempotency (§6.6)", () => {
	it("replays the existing entry when the same key and content are supplied", () => {
		const genesis = makeGenesis();
		const receipt = { kind: "approval", ref: "EXEC-001" };
		const recorded = receiptRecordedEntry(genesis, "EXEC-001", receipt);
		const replay = receiptRecordedEntry(genesis, "EXEC-001", receipt);
		const result = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: computeEntryHash(recorded),
			expectedSequence: 3,
			entry: replay,
			chain: [genesis, recorded],
		});
		expect(result.status).toBe("duplicate");
		if (result.status === "duplicate") {
			expect(result.reason).toBe("idempotency-replay");
			expect(result.existingEntry.entryId).toBe(recorded.entryId);
		}
	});

	it("conflicts when the same key is reused with different content", () => {
		const genesis = makeGenesis();
		const recorded = receiptRecordedEntry(genesis, "EXEC-001", {
			kind: "approval",
		});
		const different = receiptRecordedEntry(genesis, "EXEC-001", {
			kind: "rejection",
		});
		const result = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: computeEntryHash(recorded),
			expectedSequence: 3,
			entry: different,
			chain: [genesis, recorded],
		});
		expect(result.status).toBe("duplicate");
		if (result.status === "duplicate") {
			expect(result.reason).toBe("idempotency-conflict");
		}
	});

	it("rejects a duplicate entryId", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const twin = { ...entry };
		const result = appendEntry({
			ledgerId: LEDGER_ID,
			expectedHeadHash: computeEntryHash(entry),
			expectedSequence: 3,
			entry: twin,
			chain: [genesis, entry],
		});
		expect(result.status).toBe("duplicate");
		if (result.status === "duplicate") {
			expect(result.reason).toBe("entry-id-exists");
		}
	});
});

describe("entryTypes vocabulary (§6.3)", () => {
	it("accepts every vocabulary entry type and validates the resulting chain", () => {
		const genesis = makeGenesis();
		const chain: LedgerEntry[] = [genesis];
		const types = [
			ENTRY_TYPE.RECEIPT_RECORDED,
			ENTRY_TYPE.ATTESTATION_ADDED,
			ENTRY_TYPE.ENTRY_SUPERSEDED,
			ENTRY_TYPE.ENTRY_REVOKED,
			ENTRY_TYPE.CHECKPOINT_CREATED,
		] as const;
		for (const entryType of types) {
			const head = must(chain[chain.length - 1], "chain head");
			const next =
				entryType === ENTRY_TYPE.RECEIPT_RECORDED
					? receiptRecordedEntry(head, `R-${chain.length}`, {
							ref: `R-${chain.length}`,
						})
					: makeEntry(head, {
							entryType,
							payload: { targetEntryId: genesis.entryId },
						});
			chain.push(next);
		}
		expect(chain).toHaveLength(6);
		const report = validateLedger(toLines(...chain));
		expect(report.valid).toBe(true);
		expect(report.entriesChecked).toBe(6);
	});
});

describe("validation (§6.8)", () => {
	it("validates a pristine chain with zero findings and reports headHash", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const report = validateLedger(toLines(genesis, entry));
		expect(report.valid).toBe(true);
		expect(report.findings).toHaveLength(0);
		expect(report.entriesChecked).toBe(2);
		expect(report.ledgerId).toBe(LEDGER_ID);
		expect(report.headHash).toBe(computeEntryHash(entry));
	});

	it("collects ALL findings and never stops at the first error", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const broken: LedgerEntry = {
			...entry,
			ledgerId: "other",
			sequence: 9,
			previousEntryHash: "1".repeat(64),
			payloadHash: "0".repeat(64),
		};
		const report = validateLedger([
			...toLines(genesis),
			sortedStringify(broken),
		]);
		expect(report.valid).toBe(false);
		const codes = report.findings.map((finding) => finding.code);
		expect(codes).toContain("entry-hash");
		expect(codes).toContain("previous-hash");
		expect(codes).toContain("sequence");
		expect(codes).toContain("ledger-identity");
	});

	it("flags an edited prior line as a hash mismatch (tamper detection)", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const lines = toLines(genesis, entry);
		const firstLine = must(lines[0], "genesis line");
		const tampered = JSON.parse(firstLine) as LedgerEntry;
		const altered: LedgerEntry = {
			...tampered,
			payload: {
				...(tampered.payload as Record<string, unknown>),
				protocolVersion: "9.9",
			},
		};
		const report = validateLedger([
			sortedStringify(altered),
			must(lines[1], "entry line"),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some(
				(finding) =>
					finding.code === "entry-hash" && finding.entryIndex === 0,
			),
		).toBe(true);
	});

	it("flags a chain-link break when a committed field is edited", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const lines = toLines(genesis, entry);
		const firstLine = must(lines[0], "genesis line");
		const tampered = JSON.parse(firstLine) as LedgerEntry;
		const altered: LedgerEntry = {
			...tampered,
			payloadHash: "0".repeat(64),
		};
		const report = validateLedger([
			sortedStringify(altered),
			must(lines[1], "entry line"),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "previous-hash"),
		).toBe(true);
	});

	it("flags a sequence gap", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const skipped: LedgerEntry = { ...entry, sequence: 4 };
		const report = validateLedger([
			...toLines(genesis),
			sortedStringify(skipped),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some(
				(finding) => finding.code === "sequence" && finding.sequence === 4,
			),
		).toBe(true);
	});

	it("flags an incorrect previousEntryHash", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const detached: LedgerEntry = {
			...entry,
			previousEntryHash: "f".repeat(64),
		};
		const report = validateLedger([
			...toLines(genesis),
			sortedStringify(detached),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "previous-hash"),
		).toBe(true);
	});

	it("flags a mutated payload whose payloadHash no longer binds", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const mutated: LedgerEntry = {
			...entry,
			payload: { headEntryId: genesis.entryId, extra: "sneaked-in" },
		};
		const report = validateLedger([
			...toLines(genesis),
			sortedStringify(mutated),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some(
				(finding) =>
					finding.code === "entry-hash" && finding.entryIndex === 1,
			),
		).toBe(true);
	});

	it("flags a mutated receipt reference (receiptId + hash binding)", () => {
		const genesis = makeGenesis();
		const recorded = receiptRecordedEntry(genesis, "EXEC-001", {
			kind: "approval",
		});
		const mutatedReceipt: LedgerEntry = {
			...recorded,
			payload: {
				receiptId: "EXEC-001",
				receipt: { kind: "approval", note: "edited" },
			},
		};
		const report = validateLedger(toLines(genesis, mutatedReceipt));
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "receipt-reference"),
		).toBe(true);
	});

	it("rejects an unknown schemaVersion instead of silently accepting it", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const future: LedgerEntry = { ...entry, schemaVersion: "9.9" };
		const report = validateLedger([
			...toLines(genesis),
			sortedStringify(future),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some(
				(finding) => finding.code === "unsupported-version",
			),
		).toBe(true);
	});

	it("flags duplicate entryIds and duplicate ledgerId+sequence pairs", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const report = validateLedger(toLines(genesis, entry, { ...entry }));
		expect(report.valid).toBe(false);
		const duplicateFindings = report.findings.filter(
			(finding) => finding.code === "duplicate",
		);
		expect(duplicateFindings.length).toBeGreaterThanOrEqual(2);
	});

	it("flags a broken genesis (non-genesis first entry, wrong previous hash)", () => {
		const genesis = makeGenesis();
		const notGenesis: LedgerEntry = {
			...genesis,
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
		};
		const report = validateLedger(toLines(notGenesis));
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "genesis"),
		).toBe(true);

		const badPrevHash: LedgerEntry = {
			...genesis,
			previousEntryHash: "a".repeat(64),
		};
		const secondReport = validateLedger(toLines(badPrevHash));
		expect(secondReport.valid).toBe(false);
		expect(
			secondReport.findings.some((finding) => finding.code === "genesis"),
		).toBe(true);
	});

	it("flags a ledger identity mismatch across entries", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const intruder: LedgerEntry = { ...entry, ledgerId: "other-ledger" };
		const report = validateLedger([
			...toLines(genesis),
			sortedStringify(intruder),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "ledger-identity"),
		).toBe(true);
	});

	it("flags pretty-printed lines (canonicalization finding)", () => {
		const genesis = makeGenesis();
		const pretty = JSON.stringify(genesis, null, 2);
		const report = validateLedger([pretty]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "canonicalization"),
		).toBe(true);
	});

	it("flags an entryType outside the vocabulary", () => {
		const genesis = makeGenesis();
		const valid = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { targetEntryId: genesis.entryId },
		});
		const bad = JSON.parse(
			sortedStringify({ ...valid, entryType: "FISCAL_TAX" }),
		) as LedgerEntry;
		const report = validateLedger(toLines(genesis, bad));
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "schema"),
		).toBe(true);
	});

	it("flags a malformed line as a parse finding and keeps scanning", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const report = validateLedger([
			...toLines(genesis),
			"{ not json",
			...toLines(entry),
		]);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "parse"),
		).toBe(true);
		expect(report.entriesChecked).toBe(3);
	});
});

describe("signing policy (§6.10)", () => {
	function flipSignatureByte(signatureBase64: string): string {
	const bytes = Buffer.from(signatureBase64, "base64");
	const lastByte = bytes.readUInt8(bytes.length - 1);
	bytes.writeUInt8(lastByte ^ 0x01, bytes.length - 1);
	return bytes.toString("base64");
}

function keyPair(): { privateKey: string; publicKey: string } {
		const pair = generateKeyPairSync("ed25519");
		return {
			privateKey: pair.privateKey
				.export({ type: "pkcs8", format: "der" })
				.toString("base64"),
			publicKey: pair.publicKey
				.export({ type: "spki", format: "der" })
				.toString("base64"),
		};
	}

	const SIGNED_MANIFEST: LedgerManifest = {
		...MANIFEST,
		trustRoot: { keyIds: ["dev-ledger-key"] },
		signingPolicy: {
			required: true,
			algorithm: "Ed25519",
			keyIds: ["dev-ledger-key"],
		},
	};

	it("signs the canonical content and verifies (hash-only vs signed mode)", () => {
		const keys = keyPair();
		const genesis = makeGenesis(SIGNED_MANIFEST);
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const signed = signEntry(entry, keys.privateKey, "dev-ledger-key");
		expect(signed.signerKeyId).toBe("dev-ledger-key");
		expect(signed.signature).toBeDefined();
		expect(signed.signerPublicKey).toBe(keys.publicKey);
		expect(verifyEntrySignature(signed)).toBe(true);
		expect(verifyEntrySignature(entry)).toBe(false);
	});

	it("reports a signature finding when the signature is tampered", () => {
		const keys = keyPair();
		const genesis = makeGenesis(SIGNED_MANIFEST);
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const signed = signEntry(entry, keys.privateKey, "dev-ledger-key");
		const tampered: LedgerEntry = {
			...signed,
			signature: flipSignatureByte(signed.signature ?? ""),
		};
		const report = validateLedger(
			toLines(genesis, tampered),
			new Map([["dev-ledger-key", keys.publicKey]]),
		);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "signature"),
		).toBe(true);
	});

	it("reports a trust finding when the signer key is not in the trust root", () => {
		const keys = keyPair();
		const genesis = makeGenesis(SIGNED_MANIFEST);
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const signed = signEntry(entry, keys.privateKey, "unknown-key");
		const report = validateLedger(
			toLines(genesis, signed),
			new Map([["dev-ledger-key", keys.publicKey]]),
		);
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "trust"),
		).toBe(true);
	});

	it("flags hash-only entries that carry signature fields", () => {
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});
		const smuggled: LedgerEntry = {
			...entry,
			signature: "AAAA",
			signerPublicKey: "BBBB",
		};
		const report = validateLedger(toLines(genesis, smuggled));
		expect(report.valid).toBe(false);
		expect(
			report.findings.some((finding) => finding.code === "signature"),
		).toBe(true);
	});

	it("extracts a keyId → publicKey map from a trust-root file envelope", () => {
		const keys = keyPair();
		const trustRoot = {
			classification: "TEST-ONLY",
			keys: [{ keyId: "dev-ledger-key", publicKey: keys.publicKey }],
		};
		const map = extractTrustRootKeys(trustRoot);
		expect(map.get("dev-ledger-key")).toBe(keys.publicKey);
		expect(map.size).toBe(1);
	});
});

describe("schema conformance (§6.2, ajv draft-07)", () => {
	function keyPairForSchema(): { privateKey: string; publicKey: string } {
		const pair = generateKeyPairSync("ed25519");
		return {
			privateKey: pair.privateKey
				.export({ type: "pkcs8", format: "der" })
				.toString("base64"),
			publicKey: pair.publicKey
				.export({ type: "spki", format: "der" })
				.toString("base64"),
		};
	}

	function compileSchemas(): {
		validateEntry: (data: unknown) => boolean;
		validateManifest: (data: unknown) => boolean;
	} {
		const ajv = new Ajv({ allErrors: true, strict: true });
		addFormats(ajv);
		const entrySchemaPath = resolve(
			__dirname,
			"../../../docs/audits/schemas/ledger-entry.schema.json",
		);
		const manifestSchemaPath = resolve(
			__dirname,
			"../../../docs/audits/schemas/ledger-manifest.schema.json",
		);
		const entrySchema = JSON.parse(
			readFileSync(entrySchemaPath, "utf-8"),
		) as Record<string, unknown>;
		const manifestSchema = JSON.parse(
			readFileSync(manifestSchemaPath, "utf-8"),
		) as Record<string, unknown>;
		const validateEntry = ajv.compile(entrySchema);
		const validateManifest = ajv.compile(manifestSchema);
		return { validateEntry, validateManifest };
	}

	it("validates core-produced genesis, appended and signed entries", () => {
		const { validateEntry, validateManifest } = compileSchemas();
		const keys = keyPairForSchema();
		const signedManifest: LedgerManifest = {
			...MANIFEST,
			trustRoot: { keyIds: ["dev-ledger-key"] },
			signingPolicy: {
				required: true,
				algorithm: "Ed25519",
				keyIds: ["dev-ledger-key"],
			},
		};
		const genesis = makeGenesis(signedManifest);
		expect(validateEntry(genesis)).toBe(true);
		expect(validateManifest(genesis.payload)).toBe(true);

		const recorded = receiptRecordedEntry(genesis, "EXEC-001", {
			kind: "approval",
		});
		expect(validateEntry(recorded)).toBe(true);

		const signed = signEntry(recorded, keys.privateKey, "dev-ledger-key");
		expect(validateEntry(signed)).toBe(true);
	});

	it("rejects entries that violate shape or vocabulary rules", () => {
		const { validateEntry } = compileSchemas();
		const genesis = makeGenesis();
		const entry = makeEntry(genesis, {
			entryType: ENTRY_TYPE.CHECKPOINT_CREATED,
			payload: { headEntryId: genesis.entryId },
		});

		const badType = JSON.parse(
			sortedStringify({ ...entry, entryType: "FISCAL_TAX" }),
		) as LedgerEntry;
		expect(validateEntry(badType)).toBe(false);

		const badSequence: LedgerEntry = { ...entry, sequence: 0 };
		expect(validateEntry(badSequence)).toBe(false);

		const badHash: LedgerEntry = { ...entry, previousEntryHash: "zz" };
		expect(validateEntry(badHash)).toBe(false);

		const missingActor: LedgerEntry = { ...entry, actor: "" };
		expect(validateEntry(missingActor)).toBe(false);

		const hashOnlyWithSignature: LedgerEntry = {
			...entry,
			signerKeyId: "hash-only",
			signature: "AAAA",
			signerPublicKey: "BBBB",
		};
		expect(validateEntry(hashOnlyWithSignature)).toBe(false);

		const signedWithoutPublicKey: LedgerEntry = {
			...entry,
			signerKeyId: "dev-ledger-key",
			signature: "AAAA",
		};
		expect(validateEntry(signedWithoutPublicKey)).toBe(false);
	});
});
