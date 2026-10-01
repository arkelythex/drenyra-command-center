import { beforeEach, describe, expect, it } from "vitest";
import { ResultMerger } from "../result-merger";

describe("ResultMerger", () => {
	let merger: ResultMerger;

	beforeEach(() => {
		merger = new ResultMerger();
	});

	it("should merge results from multiple domains", () => {
		const result = merger.merge([
			{
				domainId: "compliance",
				data: { igv_amount: 180, tax_rate: 0.18 },
				confidence: 0.9,
			},
			{
				domainId: "finance",
				data: { total: 1180, currency: "PEN" },
				confidence: 0.95,
			},
		]);

		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			igv_amount: 180,
			tax_rate: 0.18,
			total: 1180,
			currency: "PEN",
		});
		expect(result.conflicts).toHaveLength(0);
	});

	it("should detect and resolve conflicts by confidence", () => {
		const result = merger.merge([
			{ domainId: "compliance", data: { igv_amount: 180 }, confidence: 0.9 },
			{ domainId: "finance", data: { igv_amount: 200 }, confidence: 0.7 },
		]);

		// compliance has higher confidence, should keep its value
		expect(result.data.igv_amount).toBe(180);
		expect(result.conflicts).toHaveLength(1);
		expect(result.conflicts[0].field).toBe("igv_amount");
		expect(result.conflicts[0].resolvedBy).toContain("confidence");
	});

	it("should handle empty results", () => {
		const result = merger.merge([]);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({});
		expect(result.conflicts).toHaveLength(0);
	});

	it("should ignore null/undefined data", () => {
		const result = merger.merge([
			{ domainId: "comp-1", data: null, confidence: 0.9 },
			{ domainId: "comp-2", data: { value: 42 }, confidence: 0.8 },
		]);

		expect(result.data).toEqual({ value: 42 });
	});

	it("should handle single domain result", () => {
		const result = merger.merge([
			{ domainId: "compliance", data: { result: "ok" }, confidence: 0.95 },
		]);

		expect(result.data).toEqual({ result: "ok" });
		expect(result.conflicts).toHaveLength(0);
	});

	it("should replace conflicting value when incoming has higher confidence (>0.85)", () => {
		const result = merger.merge([
			{ domainId: "low-conf", data: { amount: 100 }, confidence: 0.5 },
			{ domainId: "high-conf", data: { amount: 200 }, confidence: 0.9 },
		]);

		// high-conf has > 0.85 so amount should be 200
		expect(result.data.amount).toBe(200);
	});

	it("should not replace when incoming confidence is moderate", () => {
		const result = merger.merge([
			{ domainId: "first", data: { amount: 100 }, confidence: 0.9 },
			{ domainId: "second", data: { amount: 200 }, confidence: 0.8 },
		]);

		// first has 0.9 > 0.85, second has 0.8 which is > 0.8 but < 0.85
		// Actually looking at code: "if (key in data)" detects conflict.
		// First sets amount=100. Second has amount=200 and confidence 0.8.
		// Code says: if result.confidence > 0.85, replace. 0.8 is NOT > 0.85.
		// So amount stays 100.
		expect(result.data.amount).toBe(100);
	});
});
