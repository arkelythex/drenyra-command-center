import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import { TaxCalculator } from "../TaxCalculator";

describe("TaxCalculator — Percepción IGV", () => {
	it("calculates 2% for VENTA_INTERNA", () => {
		const total = Money.fromAmount(1000, "PEN");
		const result = TaxCalculator.calculatePercepcion(total, "VENTA_INTERNA");
		expect(result.taxAmount.getAmount()).toBe(20);
		expect(result.taxRate).toBe(0.02);
		expect(result.taxType).toBe("PERCEPCION");
	});

	it("calculates 3.5% for IMPORTACION", () => {
		const total = Money.fromAmount(1000, "PEN");
		const result = TaxCalculator.calculatePercepcion(total, "IMPORTACION");
		expect(result.taxAmount.getAmount()).toBe(35);
		expect(result.taxRate).toBe(0.035);
	});

	it("calculates 1% for COMBUSTIBLE", () => {
		const total = Money.fromAmount(1000, "PEN");
		const result = TaxCalculator.calculatePercepcion(total, "COMBUSTIBLE");
		expect(result.taxAmount.getAmount()).toBe(10);
		expect(result.taxRate).toBe(0.01);
	});

	it("throws for invalid percepcion type", () => {
		const total = Money.fromAmount(1000, "PEN");
		expect(() => TaxCalculator.calculatePercepcion(total, "INVALID")).toThrow(
			"Tipo de percepción inválido",
		);
	});

	it("returns totalAmount + percepcion in result totalAmount", () => {
		const total = Money.fromAmount(1000, "PEN");
		const result = TaxCalculator.calculatePercepcion(total, "VENTA_INTERNA");
		expect(result.totalAmount.getAmount()).toBe(1020);
	});

	it("handles large amounts without floating point loss", () => {
		const total = Money.fromAmount(999_999_999.99, "PEN");
		const result = TaxCalculator.calculatePercepcion(total, "IMPORTACION");
		expect(result.taxAmount.getAmount()).toBe(35000000);
	});

	it("handles zero amount", () => {
		const total = Money.fromAmount(0, "PEN");
		const result = TaxCalculator.calculatePercepcion(total, "VENTA_INTERNA");
		expect(result.taxAmount.getAmount()).toBe(0);
		expect(result.totalAmount.getAmount()).toBe(0);
	});

	it("shouldApplyPercepcion returns true for >= S/ 700 in PEN", () => {
		expect(
			TaxCalculator.shouldApplyPercepcion(Money.fromAmount(700, "PEN")),
		).toBe(true);
		expect(
			TaxCalculator.shouldApplyPercepcion(Money.fromAmount(1000, "PEN")),
		).toBe(true);
	});

	it("shouldApplyPercepcion returns false for < S/ 700 or wrong currency", () => {
		expect(
			TaxCalculator.shouldApplyPercepcion(Money.fromAmount(699.99, "PEN")),
		).toBe(false);
		expect(
			TaxCalculator.shouldApplyPercepcion(Money.fromAmount(1000, "USD")),
		).toBe(false);
		expect(
			TaxCalculator.shouldApplyPercepcion(Money.fromAmount(0, "PEN")),
		).toBe(false);
	});

	it("getPercepcionRates returns all three rates", () => {
		const rates = TaxCalculator.getPercepcionRates();
		expect(rates).toHaveLength(3);
		expect(rates.find((r) => r.code === "VENTA_INTERNA")?.rate).toBe(0.02);
		expect(rates.find((r) => r.code === "IMPORTACION")?.rate).toBe(0.035);
		expect(rates.find((r) => r.code === "COMBUSTIBLE")?.rate).toBe(0.01);
	});

	it("getPercepcionRate returns rate by type", () => {
		expect(TaxCalculator.getPercepcionRate("VENTA_INTERNA")?.rate).toBe(0.02);
		expect(TaxCalculator.getPercepcionRate("UNKNOWN")).toBeUndefined();
	});
});
