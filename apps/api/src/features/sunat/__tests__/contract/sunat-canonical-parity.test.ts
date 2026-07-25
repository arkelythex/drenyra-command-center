import { RUC as DomainRuc } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import {
	InvoiceItem,
	InvoiceNumber,
	RUC as LegacyFormatRuc,
	MonetaryAmount,
	UBLInvoiceGenerator,
} from "../../../../services/sunat";
import type { InvoiceXMLData } from "../../../../services/sunat/sunat-types";
import { generateInvoiceXML } from "../../../../services/sunat/xml-generation";
import { SunatService } from "../../../../services/sunat.service";
import type { InvoiceData } from "../../types/ubl.types";
import { generateInvoiceXml } from "../../xml/invoice-ubl.generator";
import {
	generateXmlFileName,
	parseInvoiceId,
	validateRuc as validateFeatureRucFormat,
} from "../../xml/xml-builder.helpers";

const VALID_RUCS = [
	"20100070970",
	"20100130204",
	"10123456781",
	"15123456782",
	"20123456786",
] as const;

const INVALID_RUCS = [
	"20100070971",
	"10123456780",
	"20123456780",
	"123",
	"2012345678A",
] as const;

const ISSUE_DATE = new Date("2026-01-29T00:00:00.000Z");
const DUE_DATE = new Date("2026-02-28T00:00:00.000Z");

const legacyXmlData: InvoiceXMLData = {
	invoiceNumber: "F001-00000001",
	series: "F001",
	correlative: 1,
	issueDate: ISSUE_DATE,
	dueDate: DUE_DATE,
	currency: "PEN",
	company: {
		ruc: "20100070970",
		businessName: "EMPRESA DEMO SAC",
		address: "Av. Principal 123",
	},
	customer: {
		taxId: "20100130204",
		legalName: "CLIENTE EJEMPLO SRL",
		address: "Jr. Comercio 456",
	},
	items: [
		{
			description: "Servicio de Consultoría",
			quantity: 10,
			unitPrice: 100,
			taxType: "1000",
			igvRate: 18,
			subtotal: 1000,
			igvAmount: 180,
			totalAmount: 1180,
		},
	],
	subtotal: 1000,
	igvAmount: 180,
	totalAmount: 1180,
};

const canonicalInvoiceData: InvoiceData = {
	id: "F001-00000001",
	ublVersionId: "2.1",
	customizationId: "2.0",
	invoiceTypeCode: "01",
	documentCurrencyCode: "PEN",
	issueDate: "2026-01-29",
	dueDate: "2026-02-28",
	supplier: {
		ruc: "20100070970",
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
		ruc: "20100130204",
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
			taxAmount: 180,
			taxSubtotal: [
				{
					taxableAmount: 1000,
					taxAmount: 180,
					taxCategory: "S",
					taxType: "1000",
					taxRate: 18,
				},
			],
		},
	],
	legalMonetaryTotal: {
		lineExtensionAmount: 1000,
		taxInclusiveAmount: 1180,
		payableAmount: 1180,
	},
	invoiceLines: [
		{
			id: "1",
			quantity: 10,
			unitCode: "NIU",
			lineExtensionAmount: 1000,
			unitPrice: 100,
			totalAmount: 1180,
			taxAmount: 180,
			taxCategory: "S",
			description: "Servicio de Consultoría",
		},
	],
};

function normalizeXml(xml: string): string {
	return xml.replace(/\s+/g, " ").trim();
}

function countInvoiceLines(xml: string): number {
	return xml.match(/<cac:InvoiceLine\b/g)?.length ?? 0;
}

describe("SUNAT canonical boundary characterization", () => {
	describe("RUC checksum and format boundaries", () => {
		it.each(VALID_RUCS)(
			"keeps SunatService local validation aligned with the domain RUC checksum for %s",
			(ruc) => {
				expect(DomainRuc.isValid(ruc)).toBe(true);
				expect(SunatService.validateRuc(ruc).valid).toBe(true);
				expect(SunatService.isValidRucFormat(ruc)).toBe(true);
			},
		);

		it.each(INVALID_RUCS)(
			"keeps SunatService local validation aligned with the domain RUC checksum rejection for %s",
			(ruc) => {
				expect(DomainRuc.isValid(ruc)).toBe(false);
				expect(SunatService.validateRuc(ruc).valid).toBe(false);
			},
		);

		it("documents the current feature XML helper as format-only, not checksum canonical", () => {
			// Characterization only: future checksum hardening should update this test intentionally.
			const invalidChecksumRuc = "20100070971";

			expect(DomainRuc.isValid(invalidChecksumRuc)).toBe(false);
			expect(SunatService.validateRuc(invalidChecksumRuc).valid).toBe(false);
			expect(validateFeatureRucFormat(invalidChecksumRuc)).toBe(true);
		});

		it("documents the legacy XML value object as format-only, not checksum canonical", () => {
			// Characterization only: future checksum hardening should update this test intentionally.
			const invalidChecksumRuc = "20100070971";

			expect(DomainRuc.isValid(invalidChecksumRuc)).toBe(false);
			expect(() => LegacyFormatRuc.create(invalidChecksumRuc)).not.toThrow();
		});
	});

	describe("numbering boundaries", () => {
		it.each([
			["F001", 1, "F001-00000001"],
			["B001", 99999999, "B001-99999999"],
		] as const)(
			"keeps SunatService numbering aligned with legacy InvoiceNumber for %s-%s",
			(series, correlative, expectedId) => {
				expect(
					SunatService.validateInvoiceNumbering(series, correlative),
				).toMatchObject({
					valid: true,
					series,
					correlative,
				});
				expect(InvoiceNumber.create(series, correlative).toString()).toBe(
					expectedId,
				);
				expect(parseInvoiceId(expectedId)).toEqual({
					series,
					correlative: String(correlative).padStart(8, "0"),
				});
			},
		);

		it.each([
			["X001", 1],
			["F001", 0],
			["F001", 100000000],
		] as const)(
			"rejects invalid legacy numbering %s-%s",
			(series, correlative) => {
				expect(
					SunatService.validateInvoiceNumbering(series, correlative).valid,
				).toBe(false);
				expect(() => InvoiceNumber.create(series, correlative)).toThrow();
			},
		);

		it("documents current canonical parseInvoiceId as broader than invoice/boleta facade validation", () => {
			expect(SunatService.validateInvoiceNumbering("X001", 1).valid).toBe(
				false,
			);
			expect(parseInvoiceId("X001-00000001")).toEqual({
				series: "X001",
				correlative: "00000001",
			});
		});
	});

	describe("UBL XML invoice invariants", () => {
		it("keeps required invoice invariants across the legacy simple generator and canonical feature generator", () => {
			const legacyXml = normalizeXml(generateInvoiceXML(legacyXmlData));
			const {
				xml: canonicalRawXml,
				fileName,
				hash,
			} = generateInvoiceXml(canonicalInvoiceData);
			const canonicalXml = normalizeXml(canonicalRawXml);

			for (const xml of [legacyXml, canonicalXml]) {
				expect(xml).toContain("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>");
				expect(xml).toContain("<cbc:CustomizationID>2.0</cbc:CustomizationID>");
				expect(xml).toContain("<cbc:ID>F001-00000001</cbc:ID>");
				expect(xml).toContain("20100070970");
				expect(xml).toContain("20100130204");
				expect(xml).toContain(
					"<cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>",
				);
				expect(xml).toContain(
					'<cbc:TaxAmount currencyID="PEN">180.00</cbc:TaxAmount>',
				);
				expect(xml).toContain("Servicio de Consultoría");
				expect(countInvoiceLines(xml)).toBe(1);
			}

			expect(fileName).toBe("20100070970-01-F001-00000001.xml");
			expect(hash).toMatch(/^[a-f0-9]{64}$/);
		});

		it("keeps SUNAT filename helper aligned with the canonical generator output", () => {
			const generated = generateInvoiceXml(canonicalInvoiceData);
			const parsed = parseInvoiceId(canonicalInvoiceData.id);

			expect(generated.fileName).toBe(
				generateXmlFileName(
					canonicalInvoiceData.supplier.ruc,
					canonicalInvoiceData.invoiceTypeCode,
					parsed.series,
					parsed.correlative,
				),
			);
		});

		it("characterizes the legacy class generator invariants used by the OSE send path", () => {
			const xml = normalizeXml(
				new UBLInvoiceGenerator().generate({
					issuer: {
						ruc: LegacyFormatRuc.create("20100070970"),
						name: "EMPRESA DEMO SAC",
						address: "Av. Principal 123",
						district: "San Isidro",
						province: "Lima",
						department: "Lima",
					},
					customer: {
						documentType: "RUC",
						documentNumber: "20100130204",
						name: "CLIENTE EJEMPLO SRL",
						address: "Jr. Comercio 456",
					},
					invoiceNumber: InvoiceNumber.create("F001", 1),
					issueDate: ISSUE_DATE,
					dueDate: DUE_DATE,
					currency: "PEN",
					items: [
						new InvoiceItem(
							1,
							"Servicio de Consultoría",
							10,
							MonetaryAmount.create(100, "PEN"),
						),
					],
				}),
			);

			expect(xml).toContain("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>");
			expect(xml).toContain(
				'<cbc:CustomizationID schemeAgencyName="PE:SUNAT">2.0</cbc:CustomizationID>',
			);
			expect(xml).toContain("<cbc:ID>F001-00000001</cbc:ID>");
			expect(xml).toContain("20100070970");
			expect(xml).toContain("20100130204");
			expect(xml).toContain(
				'<cbc:DocumentCurrencyCode listID="ISO 4217 Alpha"',
			);
			expect(xml).toContain("PEN</cbc:DocumentCurrencyCode>");
			expect(xml).toContain(
				'<cbc:TaxAmount currencyID="PEN">180.00</cbc:TaxAmount>',
			);
			expect(xml).toContain("Servicio de Consultoría");
			expect(countInvoiceLines(xml)).toBe(1);
		});
	});
});
