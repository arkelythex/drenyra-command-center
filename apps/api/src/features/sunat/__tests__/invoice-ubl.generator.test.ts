import { describe, expect, it } from "vitest";
import type { InvoiceData } from "../types/ubl.types";
import { generateInvoiceXml } from "../xml/invoice-ubl.generator";

describe("Invoice UBL Generator", () => {
	const validInvoiceData: InvoiceData = {
		id: "F001-00000001",
		ublVersionId: "2.1",
		customizationId: "2.0",
		invoiceTypeCode: "01",
		documentCurrencyCode: "PEN",
		issueDate: "2026-01-29",
		dueDate: "2026-02-28",
		supplier: {
			ruc: "20123456789",
			legalName: "EMPRESA DEMO SAC",
			tradeName: "DEMO",
			address: {
				streetName: "Av. Principal 123",
				district: "San Isidro",
				cityName: "Lima",
				countrySubentity: "Lima",
				country: "PE",
			},
		},
		customer: {
			ruc: "20987654321",
			legalName: "CLIENTE EJEMPLO SRL",
			address: {
				streetName: "Jr. Comercio 456",
				district: "Miraflores",
				cityName: "Lima",
				countrySubentity: "Lima",
				country: "PE",
			},
		},
		taxTotals: [
			{
				taxAmount: 180.0,
				taxSubtotal: [
					{
						taxableAmount: 1000.0,
						taxAmount: 180.0,
						taxCategory: "S",
						taxType: "1000",
						taxRate: 18.0,
					},
				],
			},
		],
		legalMonetaryTotal: {
			lineExtensionAmount: 1000.0,
			taxInclusiveAmount: 1180.0,
			payableAmount: 1180.0,
		},
		invoiceLines: [
			{
				id: "1",
				quantity: 10,
				unitCode: "NIU",
				lineExtensionAmount: 1000.0,
				unitPrice: 100.0,
				totalAmount: 1180.0,
				taxAmount: 180.0,
				taxCategory: "S",
				description: "Servicio de Consultoría",
			},
		],
	};

	describe("generateInvoiceXml", () => {
		it("should generate valid UBL 2.1 XML structure", () => {
			const { xml } = generateInvoiceXml(validInvoiceData);

			expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"');
			expect(xml).toContain(
				'<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"',
			);
			expect(xml).toContain(
				'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
			);
			expect(xml).toContain(
				'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"',
			);
		});

		it("should include correct invoice ID format", () => {
			const { xml } = generateInvoiceXml(validInvoiceData);

			expect(xml).toContain("<cbc:ID>F001-00000001</cbc:ID>");
		});

		it("should include UBLExtensions for signature", () => {
			const { xml } = generateInvoiceXml(validInvoiceData);

			expect(xml).toContain("<ext:UBLExtensions>");
			expect(xml).toContain("<ext:ExtensionContent");
		});

		it("should include supplier RUC with correct format", () => {
			const { xml } = generateInvoiceXml(validInvoiceData);

			expect(xml).toContain('<cbc:ID schemeID="6"');
		});

		it("should support boleta customers identified by DNI", () => {
			const boletaData: InvoiceData = {
				...validInvoiceData,
				id: "B001-00000001",
				invoiceTypeCode: "03",
				customer: {
					ruc: "12345678",
					documentType: "1",
					legalName: "CLIENTE DNI",
				},
			};

			const { fileName, xml } = generateInvoiceXml(boletaData);

			expect(fileName).toBe("20123456789-03-B001-00000001.xml");
			expect(xml).toContain("<cbc:InvoiceTypeCode>03</cbc:InvoiceTypeCode>");
			expect(xml).toContain('<cbc:ID schemeID="1"');
			expect(xml).toContain("12345678");
			expect(xml).toContain("CLIENTE DNI");
		});

		it("should calculate IGV at 18%", () => {
			const { xml } = generateInvoiceXml(validInvoiceData);

			expect(xml).toContain(
				'<cbc:TaxAmount currencyID="PEN">180.00</cbc:TaxAmount>',
			);
		});

		it("should include all invoice items", () => {
			const { xml } = generateInvoiceXml(validInvoiceData);

			expect(xml).toContain("Servicio de Consultoría");
			expect(xml).toContain(
				'<cbc:InvoicedQuantity unitCode="NIU">10.00</cbc:InvoicedQuantity>',
			);
		});

		it("should generate correct filename", () => {
			const { fileName } = generateInvoiceXml(validInvoiceData);

			expect(fileName).toBe("20123456789-01-F001-00000001.xml");
		});

		it("should generate SHA-256 hash", () => {
			const { hash } = generateInvoiceXml(validInvoiceData);

			expect(hash).toBeDefined();
			expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
		});

		it("should throw error for invalid series format", () => {
			const invalidData = { ...validInvoiceData, id: "INVALID-00000001" };

			expect(() => {
				generateInvoiceXml(invalidData);
			}).toThrow(/series/i);
		});

		it("should throw error for invalid RUC", () => {
			const invalidData = {
				...validInvoiceData,
				supplier: { ...validInvoiceData.supplier, ruc: "123" },
			};

			expect(() => {
				generateInvoiceXml(invalidData);
			}).toThrow(/RUC/i);
		});

		it("should keep supplier identification as RUC even when documentType is provided", () => {
			const supplierWithExplicitDniType: InvoiceData = {
				...validInvoiceData,
				supplier: {
					...validInvoiceData.supplier,
					documentType: "1",
				},
			};

			const { xml } = generateInvoiceXml(supplierWithExplicitDniType);

			expect(xml).toContain('<cbc:ID schemeID="6"');
			expect(xml).not.toContain('<cbc:ID schemeID="1">20123456789</cbc:ID>');
		});

		it("should reject DNI customers with invalid document length", () => {
			const invalidData: InvoiceData = {
				...validInvoiceData,
				customer: {
					ruc: "123",
					documentType: "1",
					legalName: "CLIENTE DNI INVALIDO",
				},
			};

			expect(() => {
				generateInvoiceXml(invalidData);
			}).toThrow(/document number/i);
		});

		it("should reject factura customers identified by DNI", () => {
			const invalidFacturaData: InvoiceData = {
				...validInvoiceData,
				invoiceTypeCode: "01",
				customer: {
					ruc: "12345678",
					documentType: "1",
					legalName: "CLIENTE DNI",
				},
			};

			expect(() => {
				generateInvoiceXml(invalidFacturaData);
			}).toThrow(/Factura customers must use RUC/i);
		});

		it("should enforce SUNAT 2026 IGV rate (18%)", () => {
			const customData = {
				...validInvoiceData,
				subtotal: 1000.0,
				igv: 180.0, // Correct 18%
				total: 1180.0,
			};

			const { xml } = generateInvoiceXml(customData);
			expect(xml).toContain("<cbc:Percent>18.00</cbc:Percent>");
		});
	});
});
