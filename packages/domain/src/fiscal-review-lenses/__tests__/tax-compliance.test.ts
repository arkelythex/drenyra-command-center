/**
 * Tests for TaxComplianceLens
 */

import { describe, expect, it } from "vitest";
import type { EvidenceInput, LensContext } from "../lens.interface";
import { TaxComplianceLens } from "../tax-compliance.lens";

function makeEvidence(overrides: Partial<EvidenceInput> = {}): EvidenceInput {
	return {
		operationId: "op-001",
		phase: "validate",
		input: {},
		output: {
			issuerRuc: "20123456789",
			customerRuc: "20234567890",
			invoiceNumber: "F001-123",
			total: 1180,
			igv: 180,
			subtotal: 1000,
			invoiceType: "01",
		},
		reasoning: "Processed invoice F001-123",
		actor: "ai",
		metadata: {},
		...overrides,
	};
}

const ctx: LensContext = {
	fiscalCalendar: { year: 2026, period: "07" },
	applicableRegulations: [],
};

describe("TaxComplianceLens", () => {
	const lens = new TaxComplianceLens();

	it("passes on valid invoice data", async () => {
		const result = await lens.review(makeEvidence(), ctx);
		expect(result.passed).toBe(true);
		expect(result.score).toBeGreaterThanOrEqual(0.5);
	});

	it("fails on invalid invoice type", async () => {
		const evidence = makeEvidence({
			output: {
				...(makeEvidence().output as Record<string, unknown>),
				invoiceType: "99",
			},
		});
		const result = await lens.review(evidence, ctx);
		expect(result.passed).toBe(false);
		expect(result.findings.some((f) => f.code === "TAX-001")).toBe(true);
	});

	it("fails on missing critical fields", async () => {
		const evidence = makeEvidence({
			output: {
				...(makeEvidence().output as Record<string, unknown>),
				issuerRuc: "",
				total: undefined,
			},
		});
		const result = await lens.review(evidence, ctx);
		expect(result.passed).toBe(false);
		expect(result.findings.some((f) => f.code === "TAX-002")).toBe(true);
	});

	it("fails on invalid RUC format", async () => {
		const evidence = makeEvidence({
			output: {
				...(makeEvidence().output as Record<string, unknown>),
				issuerRuc: "123",
			},
		});
		const result = await lens.review(evidence, ctx);
		expect(result.passed).toBe(false);
		expect(result.findings.some((f) => f.code === "TAX-004")).toBe(true);
	});

	it("warns on period mismatch", async () => {
		const evidence = makeEvidence({
			metadata: { period: "2026-06" },
		});
		const result = await lens.review(evidence, ctx);
		expect(result.findings.some((f) => f.code === "TAX-003")).toBe(true);
	});
});
