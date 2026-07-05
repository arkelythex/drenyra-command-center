import { describe, expect, it } from "vitest";
import { XmlParserService } from "../../application/services/xml-parser.service";

describe("XmlParserService", () => {
	describe("parseAndValidate", () => {
		it("parses a valid UBL 2.1 Invoice XML and extracts RUC and amount", async () => {
			const xml = `<?xml version="1.0"?>
        <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
          <cac:AccountingSupplierParty>
            <cac:Party>
              <cac:PartyIdentification>
                <cbc:ID>20601234567</cbc:ID>
              </cac:PartyIdentification>
            </cac:Party>
          </cac:AccountingSupplierParty>
          <cac:LegalMonetaryTotal>
            <cbc:PayableAmount>1180.00</cbc:PayableAmount>
          </cac:LegalMonetaryTotal>
        </Invoice>`;

			const result = await XmlParserService.parseAndValidate(xml);

			expect(result.valid).toBe(true);
			expect(String(result.data?.ruc)).toBe("20601234567");
			expect(result.data?.totalAmount).toBe(1180);
		});

		it("returns invalid for malformed XML", async () => {
			const result =
				await XmlParserService.parseAndValidate("<not valid xml>>>");

			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
		});

		it("returns invalid for XML without recognized document type", async () => {
			const xml = `<?xml version="1.0"?>
        <UnknownDocument>
          <cbc:ID>123</cbc:ID>
        </UnknownDocument>`;

			const result = await XmlParserService.parseAndValidate(xml);

			expect(result.valid).toBe(false);
			expect(result.error).toBe("Estructura XML no reconocida");
		});

		it("parses XML with default amount of 0 when PayableAmount is missing", async () => {
			const xml = `<?xml version="1.0"?>
        <Invoice>
          <cac:AccountingSupplierParty>
            <cac:Party>
              <cac:PartyIdentification>
                <cbc:ID>20601234567</cbc:ID>
              </cac:PartyIdentification>
            </cac:Party>
          </cac:AccountingSupplierParty>
        </Invoice>`;

			const result = await XmlParserService.parseAndValidate(xml);

			expect(result.valid).toBe(true);
			expect(result.data?.totalAmount).toBe(0);
		});

		it("parses XML without supplier RUC gracefully", async () => {
			const xml = `<?xml version="1.0"?>
        <Invoice>
          <cac:LegalMonetaryTotal>
            <cbc:PayableAmount>500.00</cbc:PayableAmount>
          </cac:LegalMonetaryTotal>
        </Invoice>`;

			const result = await XmlParserService.parseAndValidate(xml);

			expect(result.valid).toBe(true);
			expect(result.data?.ruc).toBeUndefined();
			expect(result.data?.totalAmount).toBe(500);
		});

		it("handles empty string input", async () => {
			const result = await XmlParserService.parseAndValidate("");

			expect(result.valid).toBe(false);
		});
	});
});
