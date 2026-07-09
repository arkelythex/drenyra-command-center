/**
 * Tests for EvidenceIntegrityLens
 */

import { describe, expect, it } from "vitest";
import { EvidenceIntegrityLens } from "../evidence-integrity.lens";
import type { EvidenceInput, LensContext } from "../lens.interface";

function makeEvidence(overrides: Partial<EvidenceInput> = {}): EvidenceInput {
	return {
		operationId: "op-001",
		phase: "validate",
		input: {},
		output: { invoiceNumber: "F001-123" },
		reasoning: "Valid invoice",
		actor: "ai",
		metadata: {
			hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
			createdAt: "2026-07-09T10:00:00.000Z",
		},
		...overrides,
	};
}

const ctx: LensContext = {};

describe("EvidenceIntegrityLens", () => {
	const lens = new EvidenceIntegrityLens();

	it("passes on complete evidence", async () => {
		const result = await lens.review(makeEvidence(), ctx);
		expect(result.passed).toBe(true);
	});

	it("fails on missing operationId", async () => {
		const evidence = makeEvidence({ operationId: "" });
		const result = await lens.review(evidence, ctx);
		expect(result.passed).toBe(false);
		expect(result.findings.some((f) => f.code === "EVI-001")).toBe(true);
	});

	it("warns on missing hash", async () => {
		const evidence = makeEvidence({
			metadata: { createdAt: "2026-07-09T10:00:00.000Z" },
		});
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "EVI-002")).toBe(true);
	});

	it("fails on invalid hash format", async () => {
		const evidence = makeEvidence({
			metadata: {
				hash: "not-a-hex-string",
				createdAt: "2026-07-09T10:00:00.000Z",
			},
		});
		const result = await lens.review(evidence, ctx);
		expect(result.passed).toBe(false);
		expect(result.findings.some((f) => f.code === "EVI-003")).toBe(true);
	});

	it("fails on invalid parent hash", async () => {
		const evidence = makeEvidence({
			metadata: {
				hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				parentHash: "bad-hash",
				createdAt: "2026-07-09T10:00:00.000Z",
			},
		});
		const result = await lens.review(evidence, ctx);
		expect(result.passed).toBe(false);
		expect(result.findings.some((f) => f.code === "EVI-004")).toBe(true);
	});

	it("warns on missing timestamp", async () => {
		const evidence = makeEvidence({
			metadata: {
				hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
			},
		});
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "EVI-005")).toBe(true);
	});

	it("warns on unknown actor", async () => {
		const evidence = makeEvidence({ actor: "bot" as "ai" });
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "EVI-006")).toBe(true);
	});
});
