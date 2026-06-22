import { describe, expect, it } from "vitest";
import { SunatService } from "../sunat.service";

describe("SunatService", () => {
	describe("validateRuc", () => {
		it("should validate a correct RUC", () => {
			const result = SunatService.validateRuc("20100070970");
			expect(result.valid).toBe(true);
			expect(result.message).toContain("válido");
		});

		it("should reject an invalid RUC", () => {
			const result = SunatService.validateRuc("20100070971");
			expect(result.valid).toBe(false);
			expect(result.message).toContain("inválido");
		});

		it("should reject RUC with invalid format", () => {
			const isValid = SunatService.isValidRucFormat("123");
			expect(isValid).toBe(false);
		});

		// Edge cases
		it("should handle 20-digit RUC pattern", () => {
			const result = SunatService.validateRuc("20000000001");
			expect(typeof result.valid).toBe("boolean");
		});

		it("should reject RUC with wrong length", () => {
			const isValid = SunatService.isValidRucFormat("2012345678"); // 10 digits
			expect(isValid).toBe(false);
		});

		it("should reject RUC with non-numeric characters", () => {
			const isValid = SunatService.isValidRucFormat("2012345678A");
			expect(isValid).toBe(false);
		});
	});

	describe("getRucType", () => {
		it("should identify PERSONA_NATURAL", () => {
			const type = SunatService.getRucType("10123456789");
			expect(type).toBe("PERSONA_NATURAL");
		});

		it("should identify EMPRESA", () => {
			const type = SunatService.getRucType("20100070970");
			expect(type).toBe("EMPRESA");
		});

		it("should return INVALID for malformed RUC", () => {
			const type = SunatService.getRucType("123");
			expect(type).toBe("INVALID");
		});

		it("should handle RUCs starting with 15", () => {
			const type = SunatService.getRucType("15123456782");
			expect(type).toBe("PERSONA_NATURAL");
		});
	});

	describe("validateInvoiceNumbering", () => {
		it("should validate correct invoice series", () => {
			const result = SunatService.validateInvoiceNumbering("F001", 123);
			expect(result.valid).toBe(true);
		});

		it("should validate correct boleta series", () => {
			const result = SunatService.validateInvoiceNumbering("B001", 456);
			expect(result.valid).toBe(true);
		});

		it("should reject invalid series format", () => {
			const result = SunatService.validateInvoiceNumbering("X001", 123);
			expect(result.valid).toBe(false);
		});

		it("should reject invalid correlative", () => {
			const result = SunatService.validateInvoiceNumbering("F001", 0);
			expect(result.valid).toBe(false);
		});

		it("should reject correlative exceeding limit", () => {
			const result = SunatService.validateInvoiceNumbering("F001", 100000000);
			expect(result.valid).toBe(false);
		});

		// Edge cases
		it("should handle minimum valid correlative (1)", () => {
			const result = SunatService.validateInvoiceNumbering("F001", 1);
			expect(result.valid).toBe(true);
		});

		it("should handle maximum valid correlative (99999999)", () => {
			const result = SunatService.validateInvoiceNumbering("F001", 99999999);
			expect(result.valid).toBe(true);
		});
	});

	describe("getExchangeRate", () => {
		it("should return exchange rate data", async () => {
			const rate = await SunatService.getExchangeRate();
			expect(rate).toHaveProperty("date");
			expect(rate).toHaveProperty("purchase");
			expect(rate).toHaveProperty("sale");
			expect(rate).toHaveProperty("source");
			expect(typeof rate.purchase).toBe("number");
			expect(typeof rate.sale).toBe("number");
		});

		it("should have valid numeric exchange rates", async () => {
			const rate = await SunatService.getExchangeRate();
			expect(rate.purchase).toBeGreaterThan(0);
			expect(rate.sale).toBeGreaterThan(0);
		});
	});
});
