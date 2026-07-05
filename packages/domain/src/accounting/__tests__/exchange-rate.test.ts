/**
 * ExchangeRate Value Object — Tests
 *
 * Covers:
 * - Happy path: valid exchange rate creation
 * - Edge cases: boundary values
 * - Error states: invalid currencies, rates
 * - getRateForConversion: SUNAT reference vs buy
 * - Conversion calculations
 */

import { describe, expect, it } from "vitest";
import { ExchangeRate, InvalidExchangeRateError } from "../exchange-rate";

describe("ExchangeRate", () => {
	const today = new Date("2026-05-15");

	// --- Happy Path ---

	it("should create a valid exchange rate", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.725, 3.735);
		expect(rate.currencyFrom).toBe("USD");
		expect(rate.currencyTo).toBe("PEN");
		expect(rate.buy).toBe(3.725);
		expect(rate.sell).toBe(3.735);
	});

	it("should create with SUNAT reference", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74, 3.73);
		expect(rate.sunatReference).toBe(3.73);
	});

	it("should create without SUNAT reference", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(rate.sunatReference).toBeNull();
	});

	it("should normalize currencies to uppercase", () => {
		const rate = ExchangeRate.create(today, "usd", "Pen", 3.72, 3.74);
		expect(rate.currencyFrom).toBe("USD");
		expect(rate.currencyTo).toBe("PEN");
	});

	it("should provide copy of date", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(rate.date.getTime()).toBe(today.getTime());
	});

	// --- Edge Cases ---

	it("should handle EUR currency", () => {
		const rate = ExchangeRate.create(today, "EUR", "PEN", 4.02, 4.08);
		expect(rate.currencyFrom).toBe("EUR");
	});

	it("should handle very small rates", () => {
		const rate = ExchangeRate.create(today, "JPY", "PEN", 0.024, 0.026);
		expect(rate.buy).toBe(0.024);
	});

	it("should handle very large rates", () => {
		const rate = ExchangeRate.create(today, "PEN", "VND", 950, 960);
		expect(rate.buy).toBe(950);
	});

	// --- Error States ---

	it("should reject invalid date", () => {
		expect(() =>
			ExchangeRate.create(new Date("invalid"), "USD", "PEN", 3.72, 3.74),
		).toThrow(InvalidExchangeRateError);
	});

	it("should reject invalid source currency code", () => {
		expect(() => ExchangeRate.create(today, "US", "PEN", 3.72, 3.74)).toThrow(
			InvalidExchangeRateError,
		);
	});

	it("should reject invalid target currency code", () => {
		expect(() => ExchangeRate.create(today, "USD", "PE", 3.72, 3.74)).toThrow(
			InvalidExchangeRateError,
		);
	});

	it("should accept lowercase ISO codes (normalized to uppercase)", () => {
		const rate = ExchangeRate.create(today, "usd", "pen", 3.72, 3.74);
		expect(rate.currencyFrom).toBe("USD");
		expect(rate.currencyTo).toBe("PEN");
	});

	it("should reject same source and target", () => {
		expect(() => ExchangeRate.create(today, "USD", "USD", 1, 1)).toThrow(
			InvalidExchangeRateError,
		);
	});

	it("should reject zero buy rate", () => {
		expect(() => ExchangeRate.create(today, "USD", "PEN", 0, 3.74)).toThrow(
			InvalidExchangeRateError,
		);
	});

	it("should reject negative buy rate", () => {
		expect(() => ExchangeRate.create(today, "USD", "PEN", -1, 3.74)).toThrow(
			InvalidExchangeRateError,
		);
	});

	it("should reject zero sell rate", () => {
		expect(() => ExchangeRate.create(today, "USD", "PEN", 3.72, 0)).toThrow(
			InvalidExchangeRateError,
		);
	});

	it("should reject negative SUNAT reference", () => {
		expect(() =>
			ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74, -1),
		).toThrow(InvalidExchangeRateError);
	});

	it("should reject non-finite buy rate", () => {
		expect(() => ExchangeRate.create(today, "USD", "PEN", NaN, 3.74)).toThrow(
			InvalidExchangeRateError,
		);

		expect(() =>
			ExchangeRate.create(today, "USD", "PEN", Infinity, 3.74),
		).toThrow(InvalidExchangeRateError);
	});

	// --- getRateForConversion ---

	it("should prefer SUNAT reference over buy rate", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74, 3.73);
		expect(rate.getRateForConversion()).toBe(3.73);
	});

	it("should fallback to buy rate when no SUNAT reference", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(rate.getRateForConversion()).toBe(3.72);
	});

	// --- Convert ---

	it("should convert amount from source to target currency", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		const result = rate.convert(100);
		expect(result).toBe(372);
	});

	it("should convert zero amount", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		const result = rate.convert(0);
		expect(result).toBe(0);
	});

	it("should reject negative amount for conversion", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(() => rate.convert(-100)).toThrow(InvalidExchangeRateError);
	});

	it("should reject non-finite amount for conversion", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(() => rate.convert(NaN)).toThrow(InvalidExchangeRateError);
	});

	// --- Equality & Serialization ---

	it("should detect equal rates", () => {
		const a = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		const b = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(a.equals(b)).toBe(true);
	});

	it("should detect non-equal rates", () => {
		const a = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		const b = ExchangeRate.create(today, "USD", "PEN", 3.73, 3.75);
		expect(a.equals(b)).toBe(false);
	});

	it("should return false for null/undefined", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(rate.equals(null)).toBe(false);
		expect(rate.equals(undefined)).toBe(false);
	});

	it("should serialize to JSON", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74, 3.73);
		const json = rate.toJSON();

		expect(json.currencyFrom).toBe("USD");
		expect(json.currencyTo).toBe("PEN");
		expect(json.buy).toBe(3.72);
		expect(json.sell).toBe(3.74);
		expect(json.sunatReference).toBe(3.73);
		expect(json.date).toBe(today.toISOString());
	});

	it("should deserialize from JSON", () => {
		const original = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74, 3.73);
		const json = original.toJSON();
		const restored = ExchangeRate.fromJSON(json);

		expect(original.equals(restored)).toBe(true);
	});

	it("should produce readable toString", () => {
		const rate = ExchangeRate.create(today, "USD", "PEN", 3.72, 3.74);
		expect(rate.toString()).toBe("ExchangeRate(USD/PEN @ 3.72/3.74)");
	});
});
