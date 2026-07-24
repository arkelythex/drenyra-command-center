/**
 * Receipt Domain Types — Tests
 *
 * Covers:
 * - hashContent consistency
 * - createReceipt builds valid receipt
 * - chain hash linking between receipts
 * - verifyReceiptChain passes for valid chain
 * - verifyReceiptChain fails for tampered receipts
 * - verifyReceiptInput / verifyReceiptOutput
 */

import { describe, expect, it } from "vitest";
import {
	createReceipt,
	hashContent,
	verifyReceiptChain,
	verifyReceiptInput,
	verifyReceiptOutput,
} from "../receipt";

const mockScope = {
	organizationId: "org_1",
	companyId: "cmp_1",
	companyRuc: "20123456789",
	fiscalPeriod: "2026-07",
};

const mockActor = { id: "usr_1", type: "user" as const };

describe("hashContent", () => {
	it("produces consistent hashes for the same input", () => {
		const a = hashContent({ hello: "world" });
		const b = hashContent({ hello: "world" });
		expect(a).toBe(b);
	});

	it("produces different hashes for different inputs", () => {
		const a = hashContent({ hello: "world" });
		const b = hashContent({ hello: "drenyra" });
		expect(a).not.toBe(b);
	});

	it("handles string input", () => {
		const result = hashContent("raw-string");
		expect(result).toHaveLength(64); // SHA-256 hex
	});
});

describe("createReceipt", () => {
	it("builds a valid receipt from input", () => {
		const receipt = createReceipt({
			id: "receipt_1",
			action: "journal:post",
			actor: mockActor,
			scope: mockScope,
			input: { amount: 1000, account: "701" },
			output: { success: true, entryId: "je_1" },
		});

		expect(receipt.id).toBe("receipt_1");
		expect(receipt.action).toBe("journal:post");
		expect(receipt.actor.id).toBe("usr_1");
		expect(receipt.scope.companyRuc).toBe("20123456789");
		expect(receipt.version).toBe("1.0.0");
		expect(receipt.inputHash).toHaveLength(64);
		expect(receipt.outputHash).toHaveLength(64);
		expect(receipt.chainHash).toHaveLength(64);
	});

	it("generates different hashes for different inputs", () => {
		const r1 = createReceipt({
			id: "r1",
			action: "journal:post",
			actor: mockActor,
			scope: mockScope,
			input: { amount: 100 },
			output: { success: true },
		});

		const r2 = createReceipt({
			id: "r2",
			action: "journal:post",
			actor: mockActor,
			scope: mockScope,
			input: { amount: 999 },
			output: { success: true },
		});

		expect(r1.inputHash).not.toBe(r2.inputHash);
		expect(r1.chainHash).not.toBe(r2.chainHash);
	});
});

describe("chain hash linking", () => {
	it("links two receipts in a chain", () => {
		const r1 = createReceipt({
			id: "r1",
			action: "document:ingest",
			actor: mockActor,
			scope: mockScope,
			input: { filename: "invoice.xml" },
			output: { documentId: "doc_1" },
		});

		const r2 = createReceipt({
			id: "r2",
			action: "document:validate",
			actor: mockActor,
			scope: mockScope,
			input: { documentId: "doc_1" },
			output: { valid: true },
			previousChainHash: r1.chainHash,
		});

		// r2's chain hash includes r1's chain hash
		expect(r2.chainHash).not.toBe(r1.chainHash);

		// Verify chain integrity
		expect(verifyReceiptChain(r1)).toBe(true);
		expect(verifyReceiptChain(r2, r1.chainHash)).toBe(true);
	});

	it("detects broken chain link", () => {
		const r1 = createReceipt({
			id: "r1",
			action: "journal:post",
			actor: mockActor,
			scope: mockScope,
			input: { debit: 500 },
			output: { entryId: "je_1" },
		});

		const r2 = createReceipt({
			id: "r2",
			action: "journal:post",
			actor: mockActor,
			scope: mockScope,
			input: { credit: 500 },
			output: { entryId: "je_2" },
			previousChainHash: "wrong-hash",
		});

		expect(verifyReceiptChain(r2, "wrong-hash")).toBe(true);
		expect(verifyReceiptChain(r2, r1.chainHash)).toBe(false);
	});

	it("first receipt in chain has no previous hash", () => {
		const r1 = createReceipt({
			id: "r1",
			action: "system:init",
			actor: { id: "system", type: "system" },
			scope: mockScope,
			input: { event: "system-start" },
			output: { status: "ok" },
		});

		// First receipt should verify with empty previous
		expect(verifyReceiptChain(r1)).toBe(true);
		expect(verifyReceiptChain(r1, undefined)).toBe(true);
	});
});

describe("verifyReceiptInput / verifyReceiptOutput", () => {
	it("verifies input matches original", () => {
		const input = { transactionId: "tx_1" };
		const receipt = createReceipt({
			id: "r1",
			action: "payment:process",
			actor: mockActor,
			scope: mockScope,
			input,
			output: { status: "completed" },
		});

		expect(verifyReceiptInput(receipt, input)).toBe(true);
		expect(verifyReceiptInput(receipt, { transactionId: "wrong" })).toBe(false);
	});

	it("verifies output matches original", () => {
		const output = { status: "completed", reference: "ref_123" };
		const receipt = createReceipt({
			id: "r1",
			action: "payment:process",
			actor: mockActor,
			scope: mockScope,
			input: { amount: 100 },
			output,
		});

		expect(verifyReceiptOutput(receipt, output)).toBe(true);
		expect(verifyReceiptOutput(receipt, { status: "failed" })).toBe(false);
	});

	it("is deterministic: same input → same hash", () => {
		const input = { items: [1, 2, 3], meta: { version: 2 } };
		const output = { total: 6 };

		const r1 = createReceipt({
			id: "a",
			action: "test",
			actor: mockActor,
			scope: mockScope,
			input,
			output,
		});

		const r2 = createReceipt({
			id: "b",
			action: "test",
			actor: mockActor,
			scope: mockScope,
			input,
			output,
		});

		expect(r1.inputHash).toBe(r2.inputHash);
		expect(r1.outputHash).toBe(r2.outputHash);
	});
});
