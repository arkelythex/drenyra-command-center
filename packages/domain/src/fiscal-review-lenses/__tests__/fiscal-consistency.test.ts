/**
 * Tests for FiscalConsistencyLens
 */

import { describe, expect, it } from "vitest";
import { FiscalConsistencyLens } from "../fiscal-consistency.lens";
import type { EvidenceInput, LensContext } from "../lens.interface";

function makeEvidence(overrides: Partial<EvidenceInput> = {}): EvidenceInput {
	return {
		operationId: "op-001",
		phase: "validate",
		input: {},
		output: {
			subtotal: 1000,
			igv: 180,
			total: 1180,
		},
		reasoning: "Invoice with IGV",
		actor: "ai",
		metadata: {},
		...overrides,
	};
}

const ctx: LensContext = {};

describe("FiscalConsistencyLens", () => {
	const lens = new FiscalConsistencyLens();

	it("passes on consistent fiscal data", async () => {
		const result = await lens.review(makeEvidence(), ctx);
		expect(result.passed).toBe(true);
	});

	it("fails on negative subtotal", async () => {
		const evidence = makeEvidence({
			output: { subtotal: -100, igv: 0, total: -100 },
		});
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "FIS-001")).toBe(true);
	});

	it("fails on subtotal + IGV ≠ total", async () => {
		const evidence = makeEvidence({
			output: { subtotal: 1000, igv: 180, total: 1500 },
		});
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "FIS-004")).toBe(true);
	});

	it("warns on IGV deviation from 18%", async () => {
		const evidence = makeEvidence({
			output: { subtotal: 1000, igv: 50, total: 1050 },
		});
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "FIS-005")).toBe(true);
	});

	it("fails when detracción exceeds total", async () => {
		const evidence = makeEvidence({
			output: { subtotal: 1000, igv: 180, total: 1180, detraccion: 1200 },
		});
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "FIS-006")).toBe(true);
	});

	it("passes with rounded values within tolerance", async () => {
		const evidence = makeEvidence({
			output: { subtotal: 847.46, igv: 152.54, total: 1000.0 },
		});
		const result = await lens.review(evidence, ctx);
		expect(result.passed).toBe(true);
	});
});
