/**
 * Tests for lens aggregation (ReviewReport)
 */

import { describe, expect, it } from "vitest";
import { EvidenceIntegrityLens } from "../evidence-integrity.lens";
import type { EvidenceInput, LensContext } from "../lens.interface";
import type { LensResultWithMeta } from "../review-report";
import { aggregateLensResults, runLenses } from "../review-report";
import { TaxComplianceLens } from "../tax-compliance.lens";

describe("aggregateLensResults", () => {
	it("aggregates passing results into APPROVE recommendation", () => {
		const results: LensResultWithMeta[] = [
			{
				lensId: "tax-compliance",
				lensName: "Tax Compliance",
				lensVersion: "1.0.0",
				passed: true,
				score: 0.95,
				findings: [],
				confidence: 0.9,
			},
			{
				lensId: "evidence-integrity",
				lensName: "Evidence Integrity",
				lensVersion: "1.0.0",
				passed: true,
				score: 0.9,
				findings: [],
				confidence: 0.85,
			},
		];

		const report = aggregateLensResults(results);
		expect(report.recommendation).toBe("APPROVE");
		expect(report.overallScore).toBeCloseTo(0.925);
		expect(report.criticalFindings).toHaveLength(0);
	});

	it("returns REVIEW for medium scores", () => {
		const results: LensResultWithMeta[] = [
			{
				lensId: "tax-compliance",
				lensName: "Tax Compliance",
				lensVersion: "1.0.0",
				passed: true,
				score: 0.55,
				findings: [
					{
						severity: "WARNING",
						code: "TAX-003",
						message: "Period mismatch",
						evidence: "test",
					},
				],
				confidence: 0.7,
			},
		];

		const report = aggregateLensResults(results);
		expect(report.recommendation).toBe("REVIEW");
	});

	it("returns REJECT for critical findings", () => {
		const results: LensResultWithMeta[] = [
			{
				lensId: "tax-compliance",
				lensName: "Tax Compliance",
				lensVersion: "1.0.0",
				passed: false,
				score: 0.2,
				findings: [
					{
						severity: "CRITICAL",
						code: "TAX-001",
						message: "Invalid invoice type",
						evidence: "invoiceType=99",
					},
				],
				confidence: 0.9,
			},
		];

		const report = aggregateLensResults(results);
		expect(report.recommendation).toBe("REJECT");
	});

	it("handles empty results", () => {
		const report = aggregateLensResults([]);
		expect(report.recommendation).toBe("APPROVE");
		expect(report.overallScore).toBe(1);
	});
});

describe("runLenses", () => {
	it("runs multiple lenses and aggregates results", async () => {
		const lenses = [new TaxComplianceLens(), new EvidenceIntegrityLens()];
		const evidence: EvidenceInput = {
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
			reasoning: "Valid invoice",
			actor: "ai",
			metadata: {
				hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				createdAt: "2026-07-09T10:00:00.000Z",
			},
		};
		const ctx: LensContext = {
			fiscalCalendar: { year: 2026, period: "07" },
		};

		const report = await runLenses(lenses, evidence, ctx);
		expect(report.lenses).toHaveLength(2);
		expect(typeof report.overallScore).toBe("number");
		expect(["APPROVE", "REVIEW", "REJECT"]).toContain(report.recommendation);
	});
});
