/**
 * CPE Validator Tests
 * Scenarios: Valid CPE, Invalid Schema, Breach Detection (RUC mismatch)
 */

import { InvalidRUCError } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import { BreachDetectorService } from "../domain/services/breach-detector.service";
import { UblValidatorService } from "../domain/services/ubl-validator.service";
import { ValidationCacheService } from "../domain/services/validation-cache.service";
import { CpeNumber } from "../domain/value-objects/cpe-number.vo";
import { Ruc } from "../domain/value-objects/ruc.vo";
import { ValidationResult } from "../domain/value-objects/validation-result.vo";
import { VALID_CPE_XML } from "./support/valid-cpe-xml";

describe("CPE Validator", () => {
	describe("RUC Value Object", () => {
		it("should validate RUC with módulo 11 algorithm", () => {
			// Valid RUC: 20100070970 (real company RUC)
			const validRuc = Ruc.create("20100070970");
			expect(validRuc.value).toBe("20100070970");
		});

		it("should reject invalid RUC (wrong check digit)", () => {
			expect(() => Ruc.create("20100070971")).toThrow(InvalidRUCError);
		});

		it("should reject RUC with wrong length", () => {
			expect(() => Ruc.create("2010007097")).toThrow(InvalidRUCError);
		});
	});

	describe("CPE Number Value Object", () => {
		it("should parse factura number", () => {
			const cpe = CpeNumber.create("F001-00001234");
			expect(cpe.serie).toBe("F001");
			expect(cpe.numero).toBe("00001234");
			expect(cpe.type).toBe("FACTURA");
		});

		it("should parse boleta number", () => {
			const cpe = CpeNumber.create("B002-00005678");
			expect(cpe.type).toBe("BOLETA");
		});

		it("should reject invalid format", () => {
			expect(() => CpeNumber.create("INVALID")).toThrow(
				"CPE number format invalid",
			);
		});
	});

	describe("Scenario 1: Valid CPE", () => {
		it("should validate correct UBL XML in < 10s", async () => {
			const validator = new UblValidatorService();

			const startTime = Date.now();
			const result = await validator.validate({ content: VALID_CPE_XML });
			const durationMs = Date.now() - startTime;

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(durationMs).toBeLessThan(10000); // < 10s
		});
	});

	describe("Scenario 2: Invalid Schema", () => {
		it("should detect missing required UBL elements", async () => {
			const validator = new UblValidatorService();

			const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>F001-00001234</cbc:ID>
  <!-- Missing required elements -->
</Invoice>`;

			const result = await validator.validate({ content: invalidXml });

			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].code).toBe("MISSING_REQUIRED_ELEMENTS");
		});

		it("should detect malformed XML", async () => {
			const validator = new UblValidatorService();

			const malformedXml = "<Invoice><unclosed>";

			const result = await validator.validate({ content: malformedXml });

			expect(result.isValid).toBe(false);
			expect(result.errors[0].code).toBe("XML_MALFORMED");
		});

		it("should detect missing SUNAT structural fields from Feb 2026 baseline", async () => {
			const validator = new UblValidatorService();

			const xmlWithoutCurrencyAndTax = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>F001-00001234</cbc:ID>
  <cbc:IssueDate>2026-02-15</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>20100070970</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>20987654326</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount>1000.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

			const result = await validator.validate({
				content: xmlWithoutCurrencyAndTax,
			});

			expect(result.isValid).toBe(false);
			expect(result.errors.map((error) => error.code)).toEqual(
				expect.arrayContaining([
					"MISSING_INVOICE_TYPE_CODE",
					"MISSING_DOCUMENT_CURRENCY_CODE",
					"MISSING_TAX_TOTAL",
					"MISSING_TAX_AMOUNT",
				]),
			);
		});

		it("should warn with OBS-3496 when an invoice line lacks standard product code", async () => {
			const validator = new UblValidatorService();

			const xmlWithoutProductCode = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>F001-00001234</cbc:ID>
  <cbc:IssueDate>2026-02-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyIdentification><cbc:ID>20100070970</cbc:ID></cac:PartyIdentification></cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party><cac:PartyIdentification><cbc:ID>20987654326</cbc:ID></cac:PartyIdentification></cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal><cbc:TaxAmount currencyID="PEN">180.00</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal><cbc:PayableAmount currencyID="PEN">1000.00</cbc:PayableAmount></cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cac:Item>
      <cbc:Description>Servicio contable</cbc:Description>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>`;

			const result = await validator.validate({
				content: xmlWithoutProductCode,
			});

			expect(result.isValid).toBe(true);
			expect(
				result.warnings.some((warning) => warning.includes("OBS-3496")),
			).toBe(true);
		});

		it("should accept 10.50 IGV percentage in the Feb 2026 baseline", async () => {
			const validator = new UblValidatorService();

			const xmlWithReducedRate = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>F001-00001234</cbc:ID>
  <cbc:IssueDate>2026-02-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyIdentification><cbc:ID>20100070970</cbc:ID></cac:PartyIdentification></cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party><cac:PartyIdentification><cbc:ID>20987654326</cbc:ID></cac:PartyIdentification></cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal><cbc:TaxAmount currencyID="PEN">95.00</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal><cbc:PayableAmount currencyID="PEN">1000.00</cbc:PayableAmount></cac:LegalMonetaryTotal>
  <cac:TaxCategory>
    <cbc:Percent>10.50</cbc:Percent>
  </cac:TaxCategory>
</Invoice>`;

			const result = await validator.validate({ content: xmlWithReducedRate });

			expect(
				result.warnings.some((warning) => warning.includes("OBS-4332")),
			).toBe(false);
		});
	});

	describe("Scenario 3: Breach Detection (RUC mismatch)", () => {
		it("should detect RUC mismatch in < 10s", async () => {
			const breachDetector = new BreachDetectorService();

			const companyRuc = Ruc.create("20100070970");
			const documentRuc = Ruc.create("20987654326"); // Different valid RUC
			const validationResult = ValidationResult.valid(100);

			const startTime = Date.now();
			const breach = await breachDetector.detect({
				companyRuc,
				documentRuc,
				validationResult,
			});
			const durationMs = Date.now() - startTime;

			expect(breach.detected).toBe(true);
			expect(breach.type).toBe("RUC_MISMATCH");
			expect(breach.severity).toBe("CRITICAL");
			expect(durationMs).toBeLessThan(10000); // < 10s
		});

		it("should not detect breach when RUCs match", async () => {
			const breachDetector = new BreachDetectorService();

			const companyRuc = Ruc.create("20100070970");
			const documentRuc = Ruc.create("20100070970"); // Same RUC
			const validationResult = ValidationResult.valid(100);

			const breach = await breachDetector.detect({
				companyRuc,
				documentRuc,
				validationResult,
			});

			expect(breach.detected).toBe(false);
			expect(breach.type).toBeUndefined();
		});
	});

	describe("Validation Cache", () => {
		it("should cache validation results", () => {
			const cache = new ValidationCacheService(10, 60000);
			const cpeNumber = CpeNumber.create("F001-00001234");
			const result = ValidationResult.valid(100);

			cache.set(cpeNumber, result);
			const cached = cache.get(cpeNumber);

			expect(cached).not.toBeNull();
			expect(cached?.isValid).toBe(true);
		});

		it("should evict LRU when cache is full", () => {
			const cache = new ValidationCacheService(3, 60000); // Max 3 items

			cache.set(CpeNumber.create("F001-00000001"), ValidationResult.valid(100));
			cache.set(CpeNumber.create("F001-00000002"), ValidationResult.valid(100));
			cache.set(CpeNumber.create("F001-00000003"), ValidationResult.valid(100));

			// Access first item to increase its access count
			cache.get(CpeNumber.create("F001-00000001"));

			// Add 4th item (should evict least accessed)
			cache.set(CpeNumber.create("F001-00000004"), ValidationResult.valid(100));

			expect(cache.get(CpeNumber.create("F001-00000001"))).not.toBeNull(); // Should still exist
			expect(cache.get(CpeNumber.create("F001-00000002"))).toBeNull(); // Should be evicted
		});

		it("should respect TTL expiration", async () => {
			const cache = new ValidationCacheService(10, 100); // 100ms TTL
			const cpeNumber = CpeNumber.create("F001-00001234");

			cache.set(cpeNumber, ValidationResult.valid(100));

			// Wait for TTL to expire
			await new Promise((resolve) => setTimeout(resolve, 150));

			const cached = cache.get(cpeNumber);
			expect(cached).toBeNull();
		});
	});
});
