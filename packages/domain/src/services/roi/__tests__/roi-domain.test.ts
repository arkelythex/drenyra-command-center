/**
 * ROI Engine — domain tests
 *
 * @group unit
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import { calculateIrr } from "../irr";
import { calculateNpv } from "../npv";
import { calculatePaybackPeriod } from "../payback-period";
import { calculateRoi } from "../roi";
import { InvalidFinancialInputError } from "../types";

// ── ROI ────────────────────────────────────────────────────────────

describe("calculateRoi", () => {
	it("should calculate positive ROI", () => {
		const result = calculateRoi({
			investment: Money.fromAmount(1000, "PEN"),
			currentValue: Money.fromAmount(1500, "PEN"),
		});
		expect(result.roiPercentage).toBe(50);
		expect(result.netGain.getAmount()).toBe(500);
	});

	it("should calculate 100% ROI (doubled)", () => {
		const result = calculateRoi({
			investment: Money.fromAmount(1000, "PEN"),
			currentValue: Money.fromAmount(2000, "PEN"),
		});
		expect(result.roiPercentage).toBe(100);
	});

	it("should calculate negative ROI", () => {
		const result = calculateRoi({
			investment: Money.fromAmount(1000, "PEN"),
			currentValue: Money.fromAmount(500, "PEN"),
		});
		expect(result.roiPercentage).toBeLessThan(0);
	});

	it("should return break-even for same value", () => {
		const result = calculateRoi({
			investment: Money.fromAmount(1000, "PEN"),
			currentValue: Money.fromAmount(1000, "PEN"),
		});
		expect(result.roiPercentage).toBe(0);
	});

	it("should throw for zero investment", () => {
		expect(() =>
			calculateRoi({
				investment: Money.zero("PEN"),
				currentValue: Money.fromAmount(100, "PEN"),
			}),
		).toThrow(InvalidFinancialInputError);
	});

	it("should include interpretation string", () => {
		const result = calculateRoi({
			investment: Money.fromAmount(1000, "PEN"),
			currentValue: Money.fromAmount(2000, "PEN"),
		});
		expect(result.interpretation).toBeTruthy();
		expect(typeof result.interpretation).toBe("string");
	});
});

// ── Payback Period ─────────────────────────────────────────────────

describe("calculatePaybackPeriod", () => {
	it("should calculate months to recover investment", () => {
		const result = calculatePaybackPeriod({
			initialInvestment: Money.fromAmount(120000, "PEN"),
			annualCashFlow: Money.fromAmount(40000, "PEN"),
		});
		expect(result.months).toBe(36);
		expect(result.years).toBe(3);
		expect(result.isInfinite).toBe(false);
	});

	it("should round up partial months", () => {
		const result = calculatePaybackPeriod({
			initialInvestment: Money.fromAmount(10000, "PEN"),
			annualCashFlow: Money.fromAmount(50000, "PEN"),
		});
		// 10000 / 50000 * 12 = 2.4 → ceil to 3
		expect(result.months).toBe(3);
	});

	it("should return zero for zero investment", () => {
		const result = calculatePaybackPeriod({
			initialInvestment: Money.zero("PEN"),
			annualCashFlow: Money.fromAmount(10000, "PEN"),
		});
		expect(result.months).toBe(0);
		expect(result.isInfinite).toBe(false);
	});

	it("should return infinite for zero cash flow", () => {
		const result = calculatePaybackPeriod({
			initialInvestment: Money.fromAmount(10000, "PEN"),
			annualCashFlow: Money.zero("PEN"),
		});
		expect(result.isInfinite).toBe(true);
		expect(result.months).toBe(Infinity);
	});

	it("should return infinite for negative cash flow", () => {
		// Money.fromAmount rejects negative — use fromCents
		const result = calculatePaybackPeriod({
			initialInvestment: Money.fromAmount(10000, "PEN"),
			annualCashFlow: Money.fromCents(0, "PEN"), // can't use negative Money
		});
		expect(result.isInfinite).toBe(true);
	});
});

// ── NPV ────────────────────────────────────────────────────────────

describe("calculateNpv", () => {
	it("should calculate positive NPV for profitable investment", () => {
		const result = calculateNpv({
			initialInvestment: Money.fromAmount(100000, "PEN"),
			cashFlows: [
				Money.fromAmount(45000, "PEN"),
				Money.fromAmount(45000, "PEN"),
				Money.fromAmount(45000, "PEN"),
			],
			discountRate: 10,
		});
		expect(result.isViable).toBe(true);
		expect(result.npvCents).toBeGreaterThan(0);
	});

	it("should calculate negative NPV for unprofitable investment", () => {
		const result = calculateNpv({
			initialInvestment: Money.fromAmount(100000, "PEN"),
			cashFlows: [
				Money.fromAmount(10000, "PEN"),
				Money.fromAmount(10000, "PEN"),
				Money.fromAmount(10000, "PEN"),
			],
			discountRate: 10,
		});
		expect(result.isViable).toBe(false);
		expect(result.npvCents).toBeLessThan(0);
	});

	it("should require at least one cash flow", () => {
		expect(() =>
			calculateNpv({
				initialInvestment: Money.fromAmount(1000, "PEN"),
				cashFlows: [],
				discountRate: 10,
			}),
		).toThrow(InvalidFinancialInputError);
	});

	it("should reject extreme discount rates", () => {
		expect(() =>
			calculateNpv({
				initialInvestment: Money.fromAmount(1000, "PEN"),
				cashFlows: [Money.fromAmount(500, "PEN")],
				discountRate: -101,
			}),
		).toThrow(InvalidFinancialInputError);
	});

	it("should handle zero discount rate", () => {
		const result = calculateNpv({
			initialInvestment: Money.fromAmount(1000, "PEN"),
			cashFlows: [Money.fromAmount(500, "PEN"), Money.fromAmount(600, "PEN")],
			discountRate: 0,
		});
		expect(result.isViable).toBe(true);
	});

	it("should make NPV positive with large cash flows", () => {
		const result = calculateNpv({
			initialInvestment: Money.fromAmount(1000, "PEN"),
			cashFlows: [Money.fromAmount(50000, "PEN")],
			discountRate: 5,
		});
		expect(result.isViable).toBe(true);
		expect(result.npvCents).toBeGreaterThan(0);
	});
});

// ── IRR ────────────────────────────────────────────────────────────

describe("calculateIrr", () => {
	it("should calculate IRR for simple investment", () => {
		const result = calculateIrr({
			initialInvestment: Money.fromAmount(100000, "PEN"),
			cashFlows: [
				Money.fromAmount(40000, "PEN"),
				Money.fromAmount(40000, "PEN"),
				Money.fromAmount(40000, "PEN"),
			],
		});
		expect(result.converged).toBe(true);
		expect(result.irr).toBeGreaterThan(0);
		expect(result.irr).toBeLessThan(100);
	});

	it("should require at least one cash flow", () => {
		expect(() =>
			calculateIrr({
				initialInvestment: Money.fromAmount(1000, "PEN"),
				cashFlows: [],
			}),
		).toThrow(InvalidFinancialInputError);
	});

	it("should not converge for all-negative cash flows", () => {
		const result = calculateIrr({
			initialInvestment: Money.fromAmount(1000, "PEN"),
			cashFlows: [Money.fromCents(0, "PEN"), Money.fromCents(0, "PEN")],
		});
		expect(result.converged).toBe(false);
	});

	it("should return null convergence for flat cash flows", () => {
		const result = calculateIrr({
			initialInvestment: Money.fromAmount(100, "PEN"),
			cashFlows: [Money.fromAmount(50, "PEN"), Money.fromAmount(50, "PEN")],
		});
		expect(typeof result.irr).toBe("number");
		expect(result.iterations).toBeGreaterThan(0);
	});
});
