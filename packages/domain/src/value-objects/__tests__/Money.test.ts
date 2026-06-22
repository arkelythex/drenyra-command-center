/**
 * Unit Tests for Money Value Object
 */

import { describe, expect, it } from "vitest";
import { InvalidAmountError } from "../../errors/InvalidAmountError";
import { Money } from "../Money";

describe("Money Value Object", () => {
	describe("Creation", () => {
		it("should create from amount", () => {
			const money = Money.fromAmount(100.5, "PEN");
			expect(money.getAmount()).toBe(100.5);
			expect(money.getCents()).toBe(10050);
			expect(money.getCurrency()).toBe("PEN");
		});

		it("should create from cents", () => {
			const money = Money.fromCents(10050, "PEN");
			expect(money.getAmount()).toBe(100.5);
			expect(money.getCents()).toBe(10050);
		});

		it("should create zero money", () => {
			const money = Money.zero("USD");
			expect(money.getAmount()).toBe(0);
			expect(money.isZero()).toBe(true);
		});

		it("should throw error for negative amount", () => {
			expect(() => Money.fromAmount(-10, "PEN")).toThrow(InvalidAmountError);
		});

		it("should throw error for non-finite amount", () => {
			expect(() => Money.fromAmount(Number.POSITIVE_INFINITY, "PEN")).toThrow(
				InvalidAmountError,
			);
			expect(() => Money.fromAmount(NaN, "PEN")).toThrow(InvalidAmountError);
		});

		it("should throw error for non-integer cents", () => {
			expect(() => Money.fromCents(100.5, "PEN")).toThrow(InvalidAmountError);
		});
	});

	describe("Arithmetic Operations", () => {
		it("should add money correctly", () => {
			const money1 = Money.fromAmount(100, "PEN");
			const money2 = Money.fromAmount(50, "PEN");
			const result = money1.add(money2);

			expect(result.getAmount()).toBe(150);
		});

		it("should subtract money correctly", () => {
			const money1 = Money.fromAmount(100, "PEN");
			const money2 = Money.fromAmount(30, "PEN");
			const result = money1.subtract(money2);

			expect(result.getAmount()).toBe(70);
		});

		it("should throw error when subtracting more than available", () => {
			const money1 = Money.fromAmount(50, "PEN");
			const money2 = Money.fromAmount(100, "PEN");

			expect(() => money1.subtract(money2)).toThrow(InvalidAmountError);
		});

		it("should multiply correctly (IGV calculation)", () => {
			const base = Money.fromAmount(1000, "PEN");
			const igv = base.multiply(0.18); // 18% IGV

			expect(igv.getAmount()).toBe(180);
		});

		it("should divide correctly", () => {
			const total = Money.fromAmount(1000, "PEN");
			const split = total.divide(4);

			expect(split.getAmount()).toBe(250);
		});

		// Edge cases for lines 111, 123
		it("should throw error when multiplying by negative factor", () => {
			const money = Money.fromAmount(100, "PEN");
			expect(() => money.multiply(-0.5)).toThrow(InvalidAmountError);
			expect(() => money.multiply(-0.5)).toThrow("Factor cannot be negative");
		});

		it("should throw error when dividing by zero", () => {
			const money = Money.fromAmount(100, "PEN");
			expect(() => money.divide(0)).toThrow(InvalidAmountError);
			expect(() => money.divide(0)).toThrow("Divisor must be positive");
		});

		it("should throw error when dividing by negative number", () => {
			const money = Money.fromAmount(100, "PEN");
			expect(() => money.divide(-2)).toThrow(InvalidAmountError);
			expect(() => money.divide(-2)).toThrow("Divisor must be positive");
		});

		it("should throw error when operating on different currencies", () => {
			const pen = Money.fromAmount(100, "PEN");
			const usd = Money.fromAmount(100, "USD");

			expect(() => pen.add(usd)).toThrow();
			expect(() => pen.subtract(usd)).toThrow();
		});
	});

	describe("Floating Point Precision", () => {
		it("should handle floating point numbers correctly", () => {
			// Classic floating point problem: 0.1 + 0.2 = 0.30000000000000004
			const money1 = Money.fromAmount(0.1, "PEN");
			const money2 = Money.fromAmount(0.2, "PEN");
			const result = money1.add(money2);

			expect(result.getAmount()).toBe(0.3); // Exact!
		});

		it("should handle complex calculations without precision loss", () => {
			// IGV calculation that would fail with floating point
			const base = Money.fromAmount(1234.567, "PEN");
			const igv = base.multiply(0.18);
			const total = base.add(igv);

			// With normal floating point: 1234.567 * 1.18 = 1456.78906
			// We expect: 1456.79 (rounded)
			expect(total.getAmount()).toBeCloseTo(1456.79, 2);
		});
	});

	describe("Comparison", () => {
		it("should compare equality", () => {
			const money1 = Money.fromAmount(100, "PEN");
			const money2 = Money.fromAmount(100, "PEN");
			const money3 = Money.fromAmount(50, "PEN");

			expect(money1.equals(money2)).toBe(true);
			expect(money1.equals(money3)).toBe(false);
		});

		it("should compare greater than", () => {
			const money1 = Money.fromAmount(100, "PEN");
			const money2 = Money.fromAmount(50, "PEN");

			expect(money1.greaterThan(money2)).toBe(true);
			expect(money2.greaterThan(money1)).toBe(false);
		});

		it("should compare less than", () => {
			const money1 = Money.fromAmount(50, "PEN");
			const money2 = Money.fromAmount(100, "PEN");

			expect(money1.lessThan(money2)).toBe(true);
			expect(money2.lessThan(money1)).toBe(false);
		});

		// Edge cases for lines 180-181
		it("should compare less than or equal", () => {
			const money1 = Money.fromAmount(50, "PEN");
			const money2 = Money.fromAmount(100, "PEN");
			const money3 = Money.fromAmount(100, "PEN");

			expect(money1.lessThanOrEqual(money2)).toBe(true);
			expect(money2.lessThanOrEqual(money1)).toBe(false);
			expect(money2.lessThanOrEqual(money3)).toBe(true); // Equal case
		});

		it("should compare greater than or equal", () => {
			const money1 = Money.fromAmount(100, "PEN");
			const money2 = Money.fromAmount(50, "PEN");
			const money3 = Money.fromAmount(100, "PEN");

			expect(money1.greaterThanOrEqual(money2)).toBe(true);
			expect(money2.greaterThanOrEqual(money1)).toBe(false);
			expect(money1.greaterThanOrEqual(money3)).toBe(true); // Equal case
		});

		it("should check if positive", () => {
			const positive = Money.fromAmount(100, "PEN");
			const zero = Money.zero("PEN");

			expect(positive.isPositive()).toBe(true);
			expect(zero.isPositive()).toBe(false);
		});
	});

	describe("Formatting", () => {
		it("should format PEN currency", () => {
			const money = Money.fromAmount(1234.56, "PEN");
			expect(money.format()).toMatch(/S\/\s*1,?234\.56/);
		});

		it("should format USD currency", () => {
			const money = Money.fromAmount(1234.56, "USD");
			expect(money.format()).toMatch(/\$\s*1,?234\.56/);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const money = Money.fromAmount(100.5, "PEN");
			const json = money.toJSON();

			expect(json).toEqual({
				amount: 100.5,
				cents: 10050,
				currency: "PEN",
			});
		});

		it("should deserialize from JSON", () => {
			const json = { amount: 100.5, currency: "PEN" as const };
			const money = Money.fromJSON(json);

			expect(money.getAmount()).toBe(100.5);
			expect(money.getCurrency()).toBe("PEN");
		});
	});

	describe("Immutability", () => {
		it("should be immutable", () => {
			const money = Money.fromAmount(100, "PEN");

			expect(() => {
				// @ts-expect-error - trying to mutate
				money.cents = 5000;
			}).toThrow();
		});

		it("should return new instance on operations", () => {
			const money1 = Money.fromAmount(100, "PEN");
			const money2 = Money.fromAmount(50, "PEN");
			const result = money1.add(money2);

			expect(result).not.toBe(money1);
			expect(result).not.toBe(money2);
			expect(money1.getAmount()).toBe(100); // Original unchanged
			expect(money2.getAmount()).toBe(50); // Original unchanged
		});
	});
});
