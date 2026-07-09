import { XMLParser, XMLValidator } from "fast-xml-parser";
import * as extractor from "./ubl-extractor";
export class UBLParser {
	parser;
	constructor() {
		this.parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			removeNSPrefix: true,
			parseTagValue: true,
			parseAttributeValue: true,
			trimValues: true,
			processEntities: false,
		});
	}
	parseInvoice(xmlContent) {
		const validation = XMLValidator.validate(xmlContent);
		if (validation !== true) {
			throw new Error(
				`XML inválido: ${validation.err?.msg || "Error de formato"}`,
			);
		}
		const doc = this.parser.parse(xmlContent);
		const invoice = doc.Invoice ?? doc.CreditNote ?? doc.DebitNote;
		if (!invoice) {
			throw new Error(
				"No se encontró elemento Invoice, CreditNote o DebitNote",
			);
		}
		try {
			return {
				id: extractor.extractText(invoice, "ID"),
				issueDate: extractor.extractText(invoice, "IssueDate"),
				dueDate: extractor.extractText(invoice, "DueDate"),
				supplierRuc: extractor.extractSupplierRuc(invoice),
				supplierName: extractor.extractSupplierName(invoice),
				customerRuc: extractor.extractCustomerRuc(invoice),
				customerName: extractor.extractCustomerName(invoice),
				subtotal: extractor.extractSubtotal(invoice),
				igv: extractor.extractIGV(invoice),
				totalAmount: extractor.extractTotal(invoice),
				currency: extractor.extractCurrency(invoice),
				items: extractor.extractItems(invoice),
			};
		} catch (error) {
			throw new Error(
				`Error al parsear factura: ${error instanceof Error ? error.message : "Error desconocido"}`,
			);
		}
	}
	safeParse(xmlContent) {
		try {
			const data = this.parseInvoice(xmlContent);
			return { success: true, data };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Error desconocido",
			};
		}
	}
	isValidUBL(xmlContent) {
		try {
			const validation = XMLValidator.validate(xmlContent);
			if (validation !== true) return false;
			const doc = this.parser.parse(xmlContent);
			return Boolean(doc.Invoice || doc.CreditNote || doc.DebitNote);
		} catch {
			return false;
		}
	}
}
export function isValidSunatXML(content) {
	const parser = new UBLParser();
	return parser.isValidUBL(content);
}
