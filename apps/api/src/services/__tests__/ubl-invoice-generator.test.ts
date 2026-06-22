/**
 * UBL Invoice Generator Tests
 */

import { describe, expect, it } from "vitest";
import {
	type InvoiceData,
	UBLInvoiceGenerator,
} from "../sunat/xml/invoice-generator";
import {
	InvoiceItem,
	InvoiceNumber,
	MonetaryAmount,
	RUC,
} from "../sunat/xml/value-objects";

describe("UBLInvoiceGenerator", () => {
	const generator = new UBLInvoiceGenerator();

	const mockData: InvoiceData = {
		issuer: {
			ruc: RUC.create("12345678901"),
			name: "EMPRESA DEMO S.A.C.",
			address: "Av. Principal 123",
			district: "Miraflores",
			province: "Lima",
			department: "Lima",
		},
		customer: {
			documentType: "RUC",
			documentNumber: "98765432109",
			name: "CLIENTE EJEMPLO S.A.",
			address: "Jr. Secundario 456",
		},
		invoiceNumber: InvoiceNumber.create("F001", 1),
		issueDate: new Date("2026-02-06"),
		dueDate: new Date("2026-03-06"),
		currency: "PEN",
		items: [
			new InvoiceItem(
				1,
				"Servicio de Consultoría",
				2,
				MonetaryAmount.create(500.0, "PEN"),
			),
			new InvoiceItem(
				2,
				"Producto Demo",
				5,
				MonetaryAmount.create(100.0, "PEN"),
			),
		],
		notes: "Gracias por su preferencia",
	};

	it("generates valid XML structure", () => {
		const xml = generator.generate(mockData);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain("<Invoice xmlns=");
		expect(xml).toContain("xmlns:cac=");
		expect(xml).toContain("xmlns:cbc=");
	});

	it("includes invoice number correctly", () => {
		const xml = generator.generate(mockData);

		expect(xml).toContain("<cbc:ID>F001-00000001</cbc:ID>");
	});

	it("includes issuer information", () => {
		const xml = generator.generate(mockData);

		expect(xml).toContain("12345678901");
		expect(xml).toContain("EMPRESA DEMO S.A.C.");
		expect(xml).toContain("Miraflores");
	});

	it("includes customer information", () => {
		const xml = generator.generate(mockData);

		expect(xml).toContain("98765432109");
		expect(xml).toContain("CLIENTE EJEMPLO S.A.");
	});

	it("calculates totals correctly", () => {
		const xml = generator.generate(mockData);

		// 2 * 500 + 5 * 100 = 1500 subtotal
		// 1500 * 0.18 = 270 IGV
		// Total = 1770
		expect(xml).toContain(
			'<cbc:LineExtensionAmount currencyID="PEN">1500.00</cbc:LineExtensionAmount>',
		);
		expect(xml).toContain(
			'<cbc:TaxAmount currencyID="PEN">270.00</cbc:TaxAmount>',
		);
		expect(xml).toContain(
			'<cbc:PayableAmount currencyID="PEN">1770.00</cbc:PayableAmount>',
		);
	});

	it("generates correct number of invoice lines", () => {
		const xml = generator.generate(mockData);

		// Count <cac:InvoiceLine> occurrences
		const matches = xml.match(/<cac:InvoiceLine>/g);
		expect(matches).toHaveLength(2);
	});

	it("includes dates in correct format", () => {
		const xml = generator.generate(mockData);

		expect(xml).toContain("<cbc:IssueDate>2026-02-06</cbc:IssueDate>");
		expect(xml).toContain("<cbc:DueDate>2026-03-06</cbc:DueDate>");
	});

	it("includes notes when provided", () => {
		const xml = generator.generate(mockData);

		expect(xml).toContain("Gracias por su preferencia");
	});

	it("uses CDATA for special characters", () => {
		const dataWithSpecialChars = {
			...mockData,
			items: [
				new InvoiceItem(
					1,
					"Producto con <special> chars & more",
					1,
					MonetaryAmount.create(100, "PEN"),
				),
			],
		};

		const xml = generator.generate(dataWithSpecialChars);

		expect(xml).toContain("<![CDATA[");
		expect(xml).toContain("Producto con <special> chars & more");
	});
});

describe("InvoiceItem calculations", () => {
	it("calculates subtotal correctly", () => {
		const item = new InvoiceItem(
			1,
			"Test",
			3,
			MonetaryAmount.create(100, "PEN"),
		);

		expect(item.getSubtotal().getAmount()).toBe(300);
	});

	it("calculates IGV correctly", () => {
		const item = new InvoiceItem(
			1,
			"Test",
			2,
			MonetaryAmount.create(500, "PEN"),
		);

		expect(item.getIGV().getAmount()).toBe(180); // 1000 * 0.18
	});

	it("calculates total correctly", () => {
		const item = new InvoiceItem(
			1,
			"Test",
			2,
			MonetaryAmount.create(500, "PEN"),
		);

		expect(item.getTotal().getAmount()).toBe(1180); // 1000 + 180
	});
});

describe("Value Objects validation", () => {
	it("creates valid RUC", () => {
		const ruc = RUC.create("12345678901");
		expect(ruc.toString()).toBe("12345678901");
	});

	it("throws on invalid RUC", () => {
		expect(() => RUC.create("123")).toThrow("RUC must be 11 digits");
		expect(() => RUC.create("abcdefghijk")).toThrow("RUC must be 11 digits");
	});

	it("creates valid InvoiceNumber", () => {
		const num = InvoiceNumber.create("F001", 123);
		expect(num.toString()).toBe("F001-00000123");
	});

	it("throws on invalid series", () => {
		expect(() => InvoiceNumber.create("X001", 1)).toThrow(
			"Series must be F001, B001",
		);
	});

	it("throws on invalid number", () => {
		expect(() => InvoiceNumber.create("F001", 0)).toThrow(
			"Number must be between 1",
		);
		expect(() => InvoiceNumber.create("F001", 999999999)).toThrow(
			"Number must be between 1",
		);
	});

	it("creates valid MonetaryAmount", () => {
		const amount = MonetaryAmount.create(1234.567, "PEN");
		expect(amount.getAmount()).toBe(1234.57); // Rounded to 2 decimals
		expect(amount.getCurrency()).toBe("PEN");
	});

	it("throws on negative amount", () => {
		expect(() => MonetaryAmount.create(-100, "PEN")).toThrow(
			"Amount cannot be negative",
		);
	});
});
