import { describe, expect, it } from "vitest";
import { IGVDomainService } from "../igv-calculator";

describe("IGVDomainService", () => {
	const igvService = new IGVDomainService();

	describe("calculateIGV", () => {
		it("should calculate 18% IGV correctly for positive amounts", () => {
			// S/ 100.00 base → S/ 18.00 IGV → S/ 118.00 total
			const result = igvService.calculateIGV(10000); // 100.00 in cents

			expect(result.baseCents).toBe(10000);
			expect(result.igvCents).toBe(1800); // 18.00 in cents
			expect(result.totalCents).toBe(11800); // 118.00 in cents
		});

		it("should handle zero base amount", () => {
			const result = igvService.calculateIGV(0);

			expect(result.baseCents).toBe(0);
			expect(result.igvCents).toBe(0);
			expect(result.totalCents).toBe(0);
		});

		it("should throw error for negative base amount", () => {
			expect(() => igvService.calculateIGV(-1000)).toThrow(
				"Base amount cannot be negative",
			);
		});

		it("should round correctly for fractional cents", () => {
			// 100.01 * 0.18 = 18.0018 → rounds to 18.00 cents
			const result = igvService.calculateIGV(10001);

			expect(result.igvCents).toBe(1800); // Rounded down
		});

		it("should handle large amounts without precision loss", () => {
			const largeAmount = 999999999999; // Large cents amount
			const result = igvService.calculateIGV(largeAmount);

			expect(result.igvCents).toBe(Math.round(largeAmount * 0.18));
			expect(result.totalCents).toBe(largeAmount + result.igvCents);
		});
	});

	describe("validateIGVCalculation", () => {
		it("should validate correct IGV calculation", () => {
			const isValid = igvService.validateIGVCalculation(10000, 1800, 11800);
			expect(isValid).toBe(true);
		});

		it("should reject incorrect IGV calculation", () => {
			const isValid = igvService.validateIGVCalculation(10000, 2000, 12000); // Wrong IGV
			expect(isValid).toBe(false);
		});

		it("should allow 1 cent tolerance for rounding", () => {
			const isValid = igvService.validateIGVCalculation(10000, 1801, 11801); // 1 cent off
			expect(isValid).toBe(true);
		});
	});
});
