import { Money, TaxCalculator } from "@drenyra/domain";
import { describe, expect, it, vi } from "vitest";
import {
	calculateDetraction,
	calculateIGV,
	suggestPCGEAccount,
	validateRUC,
} from "../src/ai/tools/index";

describe("Tool pure implementations", () => {
	it("suggestPCGEAccount returns default account", () => {
		const result = suggestPCGEAccount("Test transaction");
		expect(result).toEqual({
			cuenta: "6399",
			nombre: "Otros gastos de gestión",
			confidence: 0.85,
		});
	});

	it("calculateIGV computes 18% correctly", () => {
		const result = calculateIGV(1000);
		expect(result.base).toBe(1000);
		expect(result.igv).toBe(180);
		expect(result.total).toBe(1180);
	});

	it("calculateIGV handles inclusive amounts", () => {
		const result = calculateIGV(1180, true);
		expect(result.base).toBe(1000);
		expect(result.igv).toBe(180);
		expect(result.total).toBe(1180);
	});

	it("calculateDetraction applies correct rate for construction", () => {
		const result = calculateDetraction(1000, "construction");
		expect(result.applies).toBe(true);
		expect(result.rate).toBe(4);
		expect(result.detractionAmount).toBe(40);
	});

	it("calculateDetraction does not apply under S/ 700", () => {
		const result = calculateDetraction(500, "construction");
		expect(result.applies).toBe(false);
		expect(result.detractionAmount).toBe(0);
	});

	it("validateRUC rejects invalid format", () => {
		const result = validateRUC("123");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("RUC must be exactly 11 digits");
	});

	it("validateRUC rejects non-digit characters", () => {
		const result = validateRUC("abcdefghijk");
		expect(result.valid).toBe(false);
	});

	it("validateRUC returns type for natural person", () => {
		// RUC starting with 10 = Persona Natural
		const result = validateRUC("10768954701");
		expect(result.type).toBe("Persona Natural");
	});

	it("calculateIGV handles edge case: baseAmount = 0", () => {
		const result = calculateIGV(0);
		expect(result.base).toBe(0);
		expect(result.igv).toBe(0);
		expect(result.total).toBe(0);
	});

	it("calculateDetraction handles 'other' service type", () => {
		const result = calculateDetraction(10000, "other");
		expect(result.rate).toBe(12);
		expect(result.detractionAmount).toBe(1200);
	});

	it("calculateDetraction handles rental service type", () => {
		const result = calculateDetraction(2000, "rental");
		expect(result.rate).toBe(10);
		expect(result.detractionAmount).toBe(200);
	});

	it("calculateIGV handles large amounts", () => {
		const result = calculateIGV(1000000);
		expect(result.igv).toBe(180000);
		expect(result.total).toBe(1180000);
	});

	it("runToolLoop module exports are functions", async () => {
		const mod = await import("../src/ai/agents/tool-loop-agent");
		expect(typeof mod.runToolLoop).toBe("function");
	});

	it("fiscalTools aggregate has all 4 tools", async () => {
		const mod = await import("../src/ai/tools/index");
		expect(mod.fiscalTools.suggestPCGE).toBeDefined();
		expect(mod.fiscalTools.calculateIGV).toBeDefined();
		expect(mod.fiscalTools.calculateDetraction).toBeDefined();
		expect(mod.fiscalTools.validateRUC).toBeDefined();
	});

	describe("calculateIGV — delegates to @drenyra/domain (Fiscal Boundary Rule 4)", () => {
		it("matches the pre-refactor numeric output for an exclusive amount (regression)", () => {
			// Pre-refactor inline math for baseAmount=100, includesIGV=false:
			//   igv = round(100 * 0.18 * 100) / 100 = 18
			//   total = round((100 + 18) * 100) / 100 = 118
			const result = calculateIGV(100);
			expect(result).toEqual({ base: 100, igv: 18, total: 118 });
		});

		it("matches the pre-refactor numeric output for an inclusive amount (regression)", () => {
			// Pre-refactor inline math for baseAmount=100, includesIGV=true:
			//   base = round((100 / 1.18) * 100) / 100 = 84.75
			//   igv = round((100 - 100/1.18) * 100) / 100 = 15.25
			//   total = 100 (unchanged)
			const result = calculateIGV(100, true);
			expect(result).toEqual({ base: 84.75, igv: 15.25, total: 100 });
		});

		it("actually delegates to TaxCalculator.calculateIGV for the exclusive branch", () => {
			const spy = vi.spyOn(TaxCalculator, "calculateIGV");
			calculateIGV(250);
			expect(spy).toHaveBeenCalledTimes(1);
			const [arg] = spy.mock.calls[0] ?? [];
			expect(arg).toBeInstanceOf(Money);
			expect((arg as Money).toNumber()).toBe(250);
			spy.mockRestore();
		});

		it("actually delegates to TaxCalculator.calculateBaseFromTotal for the inclusive branch", () => {
			const spy = vi.spyOn(TaxCalculator, "calculateBaseFromTotal");
			calculateIGV(250, true);
			expect(spy).toHaveBeenCalledTimes(1);
			const [arg] = spy.mock.calls[0] ?? [];
			expect(arg).toBeInstanceOf(Money);
			expect((arg as Money).toNumber()).toBe(250);
			spy.mockRestore();
		});
	});
});
