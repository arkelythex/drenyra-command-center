/**
 * Unit Tests for TaxCalculator Domain Service
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import { TaxCalculator } from "../TaxCalculator";

describe("TaxCalculator Domain Service", () => {
	describe("IGV Calculation (18%)", () => {
		it("should calculate IGV correctly", () => {
			const base = Money.fromAmount(1000, "PEN");
			const result = TaxCalculator.calculateIGV(base);

			expect(result.baseAmount.getAmount()).toBe(1000);
			expect(result.taxAmount.getAmount()).toBe(180);
			expect(result.totalAmount.getAmount()).toBe(1180);
			expect(result.taxRate).toBe(0.18);
			expect(result.taxType).toBe("IGV");
		});

		it("should keep zero amounts at zero", () => {
			const base = Money.fromAmount(0, "PEN");
			const result = TaxCalculator.calculateIGV(base);

			expect(result.baseAmount.getAmount()).toBe(0);
			expect(result.taxAmount.getAmount()).toBe(0);
			expect(result.totalAmount.getAmount()).toBe(0);
		});

		it("should handle large amounts without floating point loss", () => {
			const base = Money.fromAmount(999_999_999.99, "PEN");
			const result = TaxCalculator.calculateIGV(base);

			expect(result.taxAmount.getAmount()).toBe(180_000_000);
			expect(result.totalAmount.getAmount()).toBe(1_179_999_999.99);
		});

		it("should handle decimal amounts", () => {
			const base = Money.fromAmount(1234.56, "PEN");
			const result = TaxCalculator.calculateIGV(base);

			// IGV = 1234.56 * 0.18 = 222.22 (rounded)
			expect(result.taxAmount.getAmount()).toBeCloseTo(222.22, 2);
			expect(result.totalAmount.getAmount()).toBeCloseTo(1456.78, 2);
		});

		it("should work with USD currency", () => {
			const base = Money.fromAmount(100, "USD");
			const result = TaxCalculator.calculateIGV(base);

			expect(result.taxAmount.getCurrency()).toBe("USD");
			expect(result.taxAmount.getAmount()).toBe(18);
		});
	});

	describe("Reverse IGV Calculation", () => {
		it("should calculate base from total", () => {
			const total = Money.fromAmount(1180, "PEN");
			const result = TaxCalculator.calculateBaseFromTotal(total);

			// Base = 1180 / 1.18 = 1000
			expect(result.baseAmount.getAmount()).toBe(1000);
			expect(result.taxAmount.getAmount()).toBe(180);
			expect(result.totalAmount.getAmount()).toBe(1180);
		});

		it("should handle decimal totals", () => {
			const total = Money.fromAmount(1456.78, "PEN");
			const result = TaxCalculator.calculateBaseFromTotal(total);

			// Base = 1456.78 / 1.18 = 1234.56
			expect(result.baseAmount.getAmount()).toBeCloseTo(1234.56, 2);
		});
	});

	describe("Detracción Calculation (SPOT System)", () => {
		it("should calculate detracción for transport services (4%)", () => {
			const total = Money.fromAmount(1000, "PEN");
			const result = TaxCalculator.calculateDetraccion(total, "001");

			expect(result.taxAmount.getAmount()).toBe(40); // 4%
			expect(result.taxRate).toBe(0.04);
			expect(result.taxType).toBe("DETRACCION");
		});

		it("should calculate detracción for intermediación laboral (12%)", () => {
			const total = Money.fromAmount(10000, "PEN");
			const result = TaxCalculator.calculateDetraccion(total, "005");

			expect(result.taxAmount.getAmount()).toBe(1200); // 12%
			expect(result.taxRate).toBe(0.12);
		});

		it("should calculate detracción for other business services (10%)", () => {
			const total = Money.fromAmount(2500, "PEN");
			const result = TaxCalculator.calculateDetraccion(total, "007");

			expect(result.taxAmount.getAmount()).toBe(250);
			expect(result.taxRate).toBe(0.1);
		});

		it("should round detracción cents deterministically", () => {
			const total = Money.fromAmount(701.05, "PEN");
			const result = TaxCalculator.calculateDetraccion(total, "007");

			expect(result.taxAmount.getAmount()).toBe(70.11);
		});

		it("should calculate detracción for arrendamiento (5%)", () => {
			const total = Money.fromAmount(2000, "PEN");
			const result = TaxCalculator.calculateDetraccion(total, "006");

			expect(result.taxAmount.getAmount()).toBe(100); // 5%
			expect(result.taxRate).toBe(0.05);
		});

		it("should throw error for invalid service code", () => {
			const total = Money.fromAmount(1000, "PEN");
			expect(() => TaxCalculator.calculateDetraccion(total, "999")).toThrow();
		});
	});

	describe("Retención Calculation (3%)", () => {
		it("should calculate retención correctly", () => {
			const base = Money.fromAmount(1000, "PEN");
			const result = TaxCalculator.calculateRetencion(base);

			expect(result.taxAmount.getAmount()).toBe(30); // 3%
			expect(result.taxRate).toBe(0.03);
			expect(result.taxType).toBe("RETENCION");
			expect(result.totalAmount.getAmount()).toBe(1000); // Total doesn't change
		});

		it("should handle large amounts", () => {
			const base = Money.fromAmount(50000, "PEN");
			const result = TaxCalculator.calculateRetencion(base);

			expect(result.taxAmount.getAmount()).toBe(1500); // 3%
		});
	});

	describe("Detracción Applicability", () => {
		it("should apply detracción when amount >= 700 PEN", () => {
			const amount = Money.fromAmount(700, "PEN");
			const shouldApply = TaxCalculator.shouldApplyDetraccion(amount, "001");

			expect(shouldApply).toBe(true);
		});

		it("should apply detracción exactly at the 700 PEN threshold", () => {
			const amount = Money.fromAmount(700, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: amount,
				applyIGV: false,
				detraccionCode: "007",
			});

			expect(breakdown.detraccion?.getAmount()).toBe(70);
			expect(breakdown.netToPay.getAmount()).toBe(630);
		});

		it("should not apply detracción when amount < 700 PEN", () => {
			const amount = Money.fromAmount(699, "PEN");
			const shouldApply = TaxCalculator.shouldApplyDetraccion(amount, "001");

			expect(shouldApply).toBe(false);
		});

		it("should not apply detracción for invalid service code", () => {
			const amount = Money.fromAmount(1000, "PEN");
			const shouldApply = TaxCalculator.shouldApplyDetraccion(amount, "999");

			expect(shouldApply).toBe(false);
		});

		it("should not apply detracción for USD (only PEN)", () => {
			const amount = Money.fromAmount(1000, "USD");
			const shouldApply = TaxCalculator.shouldApplyDetraccion(amount, "001");

			expect(shouldApply).toBe(false);
		});
	});

	describe("Retención Applicability", () => {
		it("should apply retención when amount > 700 PEN and not agente", () => {
			const amount = Money.fromAmount(701, "PEN");
			const shouldApply = TaxCalculator.shouldApplyRetencion(amount, false);

			expect(shouldApply).toBe(true);
		});

		it("should not apply retención when amount <= 700 PEN", () => {
			const amount = Money.fromAmount(700, "PEN");
			const shouldApply = TaxCalculator.shouldApplyRetencion(amount, false);

			expect(shouldApply).toBe(false);
		});

		it("should not apply retención for agente de retención", () => {
			const amount = Money.fromAmount(1000, "PEN");
			const shouldApply = TaxCalculator.shouldApplyRetencion(amount, true);

			expect(shouldApply).toBe(false);
		});

		it("should not apply retención for USD", () => {
			const amount = Money.fromAmount(1000, "USD");
			const shouldApply = TaxCalculator.shouldApplyRetencion(amount, false);

			expect(shouldApply).toBe(false);
		});
	});

	describe("Complete Invoice Breakdown", () => {
		it("should calculate complete breakdown with IGV", () => {
			const base = Money.fromAmount(1000, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: base,
				applyIGV: true,
			});

			expect(breakdown.base.getAmount()).toBe(1000);
			expect(breakdown.igv.getAmount()).toBe(180);
			expect(breakdown.total.getAmount()).toBe(1180);
			expect(breakdown.netToPay.getAmount()).toBe(1180);
			expect(breakdown.detraccion).toBeUndefined();
		});

		it("should calculate breakdown with IGV and detracción", () => {
			const base = Money.fromAmount(10000, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: base,
				applyIGV: true,
				detraccionCode: "005", // 12% intermediación laboral
			});

			expect(breakdown.base.getAmount()).toBe(10000);
			expect(breakdown.igv.getAmount()).toBe(1800);
			expect(breakdown.total.getAmount()).toBe(11800);
			expect(breakdown.detraccion?.getAmount()).toBe(1416); // 12% of 11800
			expect(breakdown.netToPay.getAmount()).toBe(10384); // 11800 - 1416
		});

		it("should not apply detracción for amounts < 700 PEN", () => {
			const base = Money.fromAmount(500, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: base,
				applyIGV: true,
				detraccionCode: "001",
			});

			expect(breakdown.detraccion).toBeUndefined();
			expect(breakdown.netToPay.getAmount()).toBe(breakdown.total.getAmount());
		});

		it("should handle export sales (0% IGV)", () => {
			const base = Money.fromAmount(1000, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: base,
				applyIGV: true,
				isExport: true,
			});

			expect(breakdown.igv.getAmount()).toBe(0);
			expect(breakdown.total.getAmount()).toBe(1000);
			expect(breakdown.netToPay.getAmount()).toBe(1000);
		});

		it("should handle invoices without IGV", () => {
			const base = Money.fromAmount(1000, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: base,
				applyIGV: false,
			});

			expect(breakdown.igv.getAmount()).toBe(0);
			expect(breakdown.total.getAmount()).toBe(1000);
		});
	});

	describe("Detracción Rates", () => {
		it("should return all detracción rates", () => {
			const rates = TaxCalculator.getDetraccionRates();

			expect(rates.length).toBeGreaterThan(0);
			expect(rates[0]).toHaveProperty("code");
			expect(rates[0]).toHaveProperty("description");
			expect(rates[0]).toHaveProperty("rate");
		});

		it("should get specific detracción rate", () => {
			const rate = TaxCalculator.getDetraccionRate("001");

			expect(rate).toBeDefined();
			expect(rate?.code).toBe("001");
			expect(rate?.description).toContain("Transporte");
			expect(rate?.rate).toBe(0.04);
		});

		it("should return undefined for invalid code", () => {
			const rate = TaxCalculator.getDetraccionRate("999");
			expect(rate).toBeUndefined();
		});
	});

	describe("Real-world Scenarios", () => {
		it("should calculate typical service invoice (S/ 5,000 with detracción)", () => {
			const base = Money.fromAmount(5000, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: base,
				applyIGV: true,
				detraccionCode: "007", // 10% otros servicios
			});

			// Base: 5000
			// IGV (18%): 900
			// Total: 5900
			// Detracción (10%): 590
			// Neto a pagar: 5310

			expect(breakdown.base.getAmount()).toBe(5000);
			expect(breakdown.igv.getAmount()).toBe(900);
			expect(breakdown.total.getAmount()).toBe(5900);
			expect(breakdown.detraccion?.getAmount()).toBe(590);
			expect(breakdown.netToPay.getAmount()).toBe(5310);
		});

		it("should calculate small service invoice without detracción", () => {
			const base = Money.fromAmount(500, "PEN");
			const breakdown = TaxCalculator.calculateInvoiceBreakdown({
				baseAmount: base,
				applyIGV: true,
				detraccionCode: "001",
			});

			// Base: 500
			// IGV: 90
			// Total: 590
			// No detracción (< 700 PEN)

			expect(breakdown.total.getAmount()).toBe(590);
			expect(breakdown.detraccion).toBeUndefined();
			expect(breakdown.netToPay.getAmount()).toBe(590);
		});
	});
});
