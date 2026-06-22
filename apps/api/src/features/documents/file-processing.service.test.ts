import { describe, expect, it } from "vitest";
import {
	detectFileType,
	generateDocumentId,
	parseXMLInvoice,
} from "./file-processing.service";

const VALID_UBL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>F001-000001</cbc:ID>
  <cbc:IssueDate>2026-02-20</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>20123456789</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Proveedor SAC</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">180.00</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">1000.00</cbc:LineExtensionAmount>
    <cbc:PayableAmount currencyID="PEN">1180.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="NIU">1</cbc:InvoicedQuantity>
    <cac:Item>
      <cbc:Description>Servicio</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">1000.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>`;

describe("documents file processing service", () => {
	it("detects file type by extension", () => {
		expect(detectFileType("invoice.xml")).toBe("XML");
		expect(detectFileType("invoice.pdf")).toBe("PDF");
		expect(detectFileType("invoice.jpg")).toBe("IMAGE");
	});

	it("generates stable document ID prefix", () => {
		expect(generateDocumentId()).toMatch(/^doc-/);
	});

	it("parses UBL xml payload", async () => {
		const parsed = await parseXMLInvoice(VALID_UBL_XML);
		expect(parsed.documentNumber).toBe("F001-000001");
		expect(parsed.providerRUC).toBe("20123456789");
		expect(parsed.currency).toBe("PEN");
	});

	it("rejects XML with unsafe DTD/entity declaration", async () => {
		await expect(
			parseXMLInvoice("<!DOCTYPE foo [<!ENTITY xxe 'bad'>]><Invoice />"),
		).rejects.toThrow("DOCTYPE/ENTITY");
	});
});
