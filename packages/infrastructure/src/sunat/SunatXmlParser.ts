/**
 * SUNAT XML Parser — Facade.
 * Parses UBL 2.1 XML documents for Peruvian electronic invoicing.
 * Split from 559 lines → types extracted to sunat-xml-parser.types.ts.
 */

import type {
	ParseResult,
	UblInvoice,
	UblInvoiceItem,
} from "./sunat-xml-parser.types";

export type {
	ParseResult,
	UblInvoice,
	UblInvoiceItem,
} from "./sunat-xml-parser.types";
export {
	DOCUMENT_TYPE_NAMES,
	IGV_AFFECTATION_NAMES,
} from "./sunat-xml-parser.types";

/**
 * SunatXmlParser class.
 */
export class SunatXmlParser {
	private xmlDoc: Document | null = null;
	private errors: string[] = [];
	private warnings: string[] = [];

	async parse(xmlString: string): Promise<ParseResult> {
		this.errors = [];
		this.warnings = [];
		try {
			this.xmlDoc = this.parseXml(xmlString);
			if (!this.xmlDoc)
				return { success: false, errors: ["No se pudo parsear el XML"] };
			const tipoDocumento = this.detectDocumentType();
			if (!tipoDocumento)
				return { success: false, errors: ["Tipo de documento no reconocido"] };
			const invoice = await this.extractInvoiceData(tipoDocumento);
			if (this.errors.length > 0)
				return { success: false, errors: this.errors, warnings: this.warnings };
			return {
				success: true,
				invoice,
				warnings: this.warnings.length > 0 ? this.warnings : undefined,
			};
		} catch (error) {
			console.error("XML parsing error:", error);
			return {
				success: false,
				errors: [
					error instanceof Error ? error.message : "Error al procesar XML",
				],
			};
		}
	}

	private parseXml(xmlString: string): Document | null {
		try {
			return this.createSimpleDocument(xmlString);
		} catch {
			this.errors.push("Error de parsing XML");
			return null;
		}
	}

	private createSimpleDocument(xmlString: string): Document | null {
		const doc = {
			xmlString,
			getValue: (tagName: string): string | null => {
				const regex = new RegExp(
					`<[^>]*:?${tagName}[^>]*>([^<]*)</[^>]*:?${tagName}>`,
					"i",
				);
				const match = xmlString.match(regex);
				return match?.[1] !== undefined ? match[1].trim() : null;
			},
			getAttr: (tagName: string, attrName: string): string | null => {
				const regex = new RegExp(
					`<[^>]*:?${tagName}[^>]*${attrName}="([^"]*)"`,
					"i",
				);
				const match = xmlString.match(regex);
				return match?.[1] !== undefined ? match[1] : null;
			},
			getAllValues: (tagName: string): string[] => {
				const regex = new RegExp(
					`<[^>]*:?${tagName}[^>]*>([^<]*)</[^>]*:?${tagName}>`,
					"gi",
				);
				return [...xmlString.matchAll(regex)]
					.map((m) => m[1]?.trim() ?? "")
					.filter((v) => v !== "");
			},
		};
		return doc as unknown as Document;
	}

	private detectDocumentType(): "01" | "03" | "07" | "08" | null {
		if (!this.xmlDoc) return null;
		const xmlString = (this.xmlDoc as unknown as { xmlString: string })
			.xmlString;
		const typeMatch = xmlString.match(/<[^>]*:?InvoiceTypeCode[^>]*>(\d+)/i);
		if (typeMatch) {
			const code = typeMatch[1];
			if (code === "01" || code === "03" || code === "07" || code === "08")
				return code;
		}
		if (xmlString.includes("CreditNote")) return "07";
		if (xmlString.includes("DebitNote")) return "08";
		if (xmlString.includes("Invoice")) return "01";
		return null;
	}

	private async extractInvoiceData(
		tipoDocumento: "01" | "03" | "07" | "08",
	): Promise<UblInvoice> {
		const doc = this.xmlDoc as unknown as {
			xmlString: string;
			getValue: (tag: string) => string | null;
			getAttr: (tag: string, attr: string) => string | null;
		};
		const serieNumero = doc.getValue("ID") || "";
		const [serie, numero] = serieNumero.split("-");
		const fechaEmisionStr = doc.getValue("IssueDate");
		const fechaVencimientoStr = doc.getValue("DueDate");
		const subtotalStr =
			this.extractAmount(doc.xmlString, "LineExtensionAmount") || "0";
		const igvStr = this.extractTaxAmount(doc.xmlString, "1000") || "0";
		const totalStr = this.extractAmount(doc.xmlString, "PayableAmount") || "0";
		const emisorRuc = this.extractPartyId(
			doc.xmlString,
			"AccountingSupplierParty",
		);
		const emisorRazonSocial = this.extractPartyName(
			doc.xmlString,
			"AccountingSupplierParty",
		);
		const receptorNumDoc = this.extractPartyId(
			doc.xmlString,
			"AccountingCustomerParty",
		);
		const receptorRazonSocial = this.extractPartyName(
			doc.xmlString,
			"AccountingCustomerParty",
		);
		const currencyCode =
			doc.getAttr("LineExtensionAmount", "currencyID") || "PEN";
		const items = this.extractItems(doc.xmlString);
		const detraccion = this.extractDetraccion(doc.xmlString);

		const invoice: UblInvoice = {
			tipoDocumento,
			serie: serie || "F001",
			numero: numero || "00000001",
			fechaEmision: fechaEmisionStr ? new Date(fechaEmisionStr) : new Date(),
			fechaVencimiento: fechaVencimientoStr
				? new Date(fechaVencimientoStr)
				: undefined,
			emisorRuc: emisorRuc || "00000000000",
			emisorRazonSocial: emisorRazonSocial || "EMPRESA NO IDENTIFICADA",
			receptorTipoDoc:
				receptorNumDoc?.length === 11
					? "6"
					: receptorNumDoc?.length === 8
						? "1"
						: "0",
			receptorNumDoc: receptorNumDoc || "00000000",
			receptorRazonSocial: receptorRazonSocial || "CLIENTE NO IDENTIFICADO",
			moneda: currencyCode === "USD" ? "USD" : "PEN",
			subtotal: parseFloat(subtotalStr),
			descuentos: 0,
			igv: parseFloat(igvStr),
			otrosTributos: 0,
			total: parseFloat(totalStr),
			tieneDetraccion: detraccion.tieneDetraccion,
			codigoDetraccion: detraccion.codigoDetraccion,
			porcentajeDetraccion: detraccion.porcentajeDetraccion,
			montoDetraccion: detraccion.montoDetraccion,
			items,
		};
		this.validateInvoice(invoice);
		return invoice;
	}

	private extractAmount(xml: string, tagName: string): string | null {
		const regex = new RegExp(
			`<[^>]*:?${tagName}[^>]*>([\\d.]+)</[^>]*:?${tagName}>`,
			"i",
		);
		const match = xml.match(regex);
		return match?.[1] !== undefined ? match[1] : null;
	}

	private extractTaxAmount(xml: string, taxCode: string): string | null {
		const taxSectionRegex = new RegExp(
			`<[^>]*TaxSubtotal[^>]*>[\\s\\S]*?<[^>]*ID[^>]*>${taxCode}</[^>]*ID>[\\s\\S]*?<[^>]*TaxAmount[^>]*>([\\d.]+)</[^>]*TaxAmount>`,
			"i",
		);
		const match = xml.match(taxSectionRegex);
		return match?.[1] !== undefined ? match[1] : null;
	}

	private extractPartyId(xml: string, partyTag: string): string | null {
		const sectionRegex = new RegExp(
			`<[^>]*${partyTag}[^>]*>([\\s\\S]*?)</[^>]*${partyTag}>`,
			"i",
		);
		const section = xml.match(sectionRegex)?.[1];
		if (!section) return null;
		const idRegex = /<[^>]*:?CompanyID[^>]*>(\d+)/i;
		const match = section.match(idRegex);
		return match?.[1] !== undefined ? match[1] : null;
	}

	private extractPartyName(xml: string, partyTag: string): string | null {
		const sectionRegex = new RegExp(
			`<[^>]*${partyTag}[^>]*>([\\s\\S]*?)</[^>]*${partyTag}>`,
			"i",
		);
		const section = xml.match(sectionRegex)?.[1];
		if (!section) return null;
		const nameRegex = /<[^>]*:?RegistrationName[^>]*>([^<]+)/i;
		const match = section.match(nameRegex);
		return match?.[1] !== undefined ? match[1].trim() : null;
	}

	private extractItems(xml: string): UblInvoiceItem[] {
		const items: UblInvoiceItem[] = [];
		const lineRegex =
			/<[^>]*(InvoiceLine|CreditNoteLine|DebitNoteLine)[^>]*>([\s\S]*?)<\/[^>]*\1>/gi;
		const matches = [...xml.matchAll(lineRegex)];
		for (let i = 0; i < matches.length; i++) {
			const matchGroup = matches[i];
			if (!matchGroup || matchGroup[2] === undefined) continue;
			const lineXml = matchGroup[2];
			const cantidadStr =
				this.extractValue(lineXml, "InvoicedQuantity") ||
				this.extractValue(lineXml, "CreditedQuantity") ||
				"1";
			const precioStr = this.extractAmount(lineXml, "PriceAmount") || "0";
			const valorStr =
				this.extractAmount(lineXml, "LineExtensionAmount") || "0";
			const igvStr = this.extractAmount(lineXml, "TaxAmount") || "0";
			const item: UblInvoiceItem = {
				id: this.extractValue(lineXml, "ID") || `${i + 1}`,
				codigo:
					this.extractValue(lineXml, "ItemClassificationCode") || undefined,
				descripcion:
					this.extractValue(lineXml, "Description") || "Sin descripción",
				unidadMedida: this.extractValue(lineXml, "unitCode") || "UND",
				cantidad: parseFloat(cantidadStr),
				precioUnitario: parseFloat(precioStr),
				valorVenta: parseFloat(valorStr),
				igv: parseFloat(igvStr),
				total: 0,
				tipoAfectacionIgv:
					this.extractValue(lineXml, "TaxExemptionReasonCode") || "10",
			};
			item.total = item.valorVenta + item.igv;
			items.push(item);
		}
		return items;
	}

	private extractDetraccion(xml: string): {
		tieneDetraccion: boolean;
		codigoDetraccion?: string;
		porcentajeDetraccion?: number;
		montoDetraccion?: number;
	} {
		const detRegex = /<[^>]*PaymentMeansCode[^>]*>OperacionesRetenPer/i;
		const hasDetraccion = detRegex.test(xml);
		if (!hasDetraccion) return { tieneDetraccion: false };
		const codeRegex = /<[^>]*PaymentMeansCode[^>]*listName="([^"]+)"/i;
		const codeMatch = xml.match(codeRegex);
		const percentRegex = /<[^>]*PaymentPercent[^>]*>([\d.]+)/i;
		const percentMatch = xml.match(percentRegex);
		const amountRegex = /<[^>]*PrepaidAmount[^>]*>([\d.]+)/i;
		const amountMatch = xml.match(amountRegex);
		return {
			tieneDetraccion: true,
			codigoDetraccion: codeMatch?.[1],
			porcentajeDetraccion:
				percentMatch?.[1] !== undefined
					? parseFloat(percentMatch[1])
					: undefined,
			montoDetraccion:
				amountMatch?.[1] !== undefined ? parseFloat(amountMatch[1]) : undefined,
		};
	}

	private extractValue(xml: string, tagName: string): string | null {
		const regex = new RegExp(`<[^>]*:?${tagName}[^>]*>([^<]+)`, "i");
		const match = xml.match(regex);
		return match?.[1] !== undefined ? match[1].trim() : null;
	}

	private validateInvoice(invoice: UblInvoice): void {
		if (!invoice.emisorRuc || invoice.emisorRuc.length !== 11)
			this.warnings.push("RUC del emisor inválido o ausente");
		if (!invoice.receptorNumDoc)
			this.warnings.push("Documento del receptor ausente");
		if (invoice.total <= 0)
			this.warnings.push("Total del documento es cero o negativo");
		if (invoice.items.length === 0)
			this.warnings.push("No se encontraron ítems en el documento");
		const expectedIgv = invoice.subtotal * 0.18;
		const igvDiff = Math.abs(invoice.igv - expectedIgv);
		if (igvDiff > 1 && invoice.subtotal > 0)
			this.warnings.push(
				`IGV (${invoice.igv}) difiere del cálculo esperado (${expectedIgv.toFixed(2)})`,
			);
	}
}

export function createXmlParser(): SunatXmlParser {
	return new SunatXmlParser();
}
