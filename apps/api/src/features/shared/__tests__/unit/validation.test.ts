import { describe, expect, it } from "vitest";
import {
	generateCorrelativo,
	validateDocumentType,
	validateInvoiceSeries,
} from "../shared/validation";

describe("Shared Validation Helpers", () => {
	describe("validateInvoiceSeries", () => {
		it("should validate correct invoice series format F001", () => {
			expect(validateInvoiceSeries("F001")).toBe(true);
			expect(validateInvoiceSeries("B001")).toBe(true);
		});

		it("should reject invalid series format", () => {
			expect(validateInvoiceSeries("001")).toBe(false);
			expect(validateInvoiceSeries("F")).toBe(false);
			expect(validateInvoiceSeries("F01")).toBe(false);
		});
	});

	describe("generateCorrelativo", () => {
		it("should generate correlativo with padding", () => {
			const correlativo = generateCorrelativo(1);
			expect(correlativo).toBe("00000001");
		});

		it("should handle large numbers", () => {
			const correlativo = generateCorrelativo(999999);
			expect(correlativo).toBe("0999999");
		});
	});

	describe("validateDocumentType", () => {
		it("should validate correct document types", () => {
			expect(validateDocumentType("01")).toBe(true); // Factura
			expect(validateDocumentType("03")).toBe(true); // Boleta
			expect(validateDocumentType("07")).toBe(true); // Nota de crédito
			expect(validateDocumentType("08")).toBe(true); // Nota de débido
		});

		it("should reject invalid document types", () => {
			expect(validateDocumentType("00")).toBe(false);
			expect(validateDocumentType("99")).toBe(false);
			expect(validateDocumentType("invalid")).toBe(false);
		});
	});
});
