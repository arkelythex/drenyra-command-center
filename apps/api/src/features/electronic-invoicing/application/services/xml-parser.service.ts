/**
 * XML Parser Service — parses and validates UBL 2.1 XML documents.
 * Extracted from ElectronicInvoicingService.validateXMLStructure().
 */
import { XMLParser } from "fast-xml-parser";
import type { ValidatedXmlInvoiceData } from "../../domain/cpe.types";

export class XmlParserService {
	/**
	 * Validates UBL 2.1 XML structure and extracts key invoice data.
	 */
	static async parseAndValidate(xmlContent: string): Promise<{
		valid: boolean;
		data?: ValidatedXmlInvoiceData;
		error?: string;
	}> {
		try {
			const parser = new XMLParser({
				ignoreAttributes: false,
				attributeNamePrefix: "@_",
				parseTagValue: true,
				trimValues: true,
				parseAttributeValue: true,
			});

			const doc = parser.parse(xmlContent);
			const invoice =
				doc.Invoice || doc.Bill || doc.CreditNote || doc.DebitNote;

			if (!invoice) {
				return { valid: false, error: "Estructura XML no reconocida" };
			}

			const supplierParty =
				invoice["cac:AccountingSupplierParty"]?.["cac:Party"];
			const ruc = supplierParty?.["cac:PartyIdentification"]?.["cbc:ID"];
			const totalAmount =
				invoice["cac:LegalMonetaryTotal"]?.["cbc:PayableAmount"];

			return {
				valid: true,
				data: {
					ruc,
					totalAmount: parseFloat(totalAmount || "0"),
					invoice,
				},
			};
		} catch (error) {
			return {
				valid: false,
				error: error instanceof Error ? error.message : "Error de parseo XML",
			};
		}
	}
}
