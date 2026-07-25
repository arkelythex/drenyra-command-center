/**
 * UBL 2.1 Credit Note XML Generator
 * Generates SUNAT-compliant XML for credit notes
 *
 * Based on: Guía XML Nota de Crédito UBL 2.1 - SUNAT 2026
 */

import crypto from "node:crypto";
import { create } from "xmlbuilder2";
import {
	CUSTOMIZATION_ID,
	SCHEMA_LOCATIONS,
	UBL_VERSION,
	XML_NAMESPACES,
} from "../constants/ubl-constants";
import type { CreditNoteData, XmlGenerationResult } from "../types/ubl.types";
import {
	createAmountElement,
	createPartyElement,
	formatDate,
	generateXmlFileName,
	parseInvoiceId,
	validatePartyDocument,
} from "./xml-builder.helpers";

/**
 * Credit Note Response Codes (SUNAT)
 *
 * @example
 * ```ts
 * const code = CREDIT_NOTE_REASON_CODES.ANULACION; // "01"
 * ```
 */
export const CREDIT_NOTE_REASON_CODES = {
	ANULACION: "01", // Anulación de la operación
	ANULACION_ERROR_RUC: "02", // Anulación por error en RUC
	CORRECCION_DATOS: "03", // Corrección por error en descripción
	DESCUENTO_GLOBAL: "04", // Descuento global
	DESCUENTO_ITEM: "05", // Descuento por ítem
	DEVOLUCION_TOTAL: "06", // Devolución total
	DEVOLUCION_PARCIAL: "07", // Devolución por ítem
	BONIFICACION: "08", // Bonificación
	DISMINUCION_VALOR: "09", // Disminución en el valor
	OTROS_CONCEPTOS: "10", // Otros conceptos
} as const;

/**
 * Generate UBL 2.1 Credit Note XML.
 *
 * @param data - Credit note data payload for UBL generation
 * @returns XML, hash (sha256) and file name
 *
 * @example
 * ```ts
 * const res = generateCreditNoteXml({ id: "FC01-00000001" } as CreditNoteData);
 * console.log(res.hash);
 * ```
 */
export function generateCreditNoteXml(
	data: CreditNoteData,
): XmlGenerationResult {
	// Validate and parse credit note ID
	const { series, correlative } = parseInvoiceId(data.id);
	const supplier = { ...data.supplier, documentType: "6" as const };
	const originalDocumentId = data.billingReference.invoiceDocumentReference.id;

	if (!validatePartyDocument(supplier.ruc, supplier.documentType)) {
		throw new Error(`Invalid RUC for supplier: ${supplier.ruc}`);
	}

	if (!validatePartyDocument(data.customer.ruc, data.customer.documentType)) {
		throw new Error(
			`Invalid document number for customer: ${data.customer.ruc}`,
		);
	}

	if (
		data.customer.documentType === "1" &&
		!originalDocumentId.startsWith("B")
	) {
		throw new Error("Credit notes with DNI customers must reference a boleta");
	}

	// Create root CreditNote element
	const doc = create({ version: "1.0", encoding: "UTF-8", standalone: false })
		.ele(XML_NAMESPACES.creditNote, "CreditNote")
		.att("xmlns:cac", XML_NAMESPACES.cac)
		.att("xmlns:cbc", XML_NAMESPACES.cbc)
		.att("xmlns:ds", XML_NAMESPACES.ds)
		.att("xmlns:ext", XML_NAMESPACES.ext)
		.att("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
		.att("xsi:schemaLocation", SCHEMA_LOCATIONS.creditNote);

	// UBL Extensions (for digital signature)
	doc
		.ele("ext:UBLExtensions")
		.ele("ext:UBLExtension")
		.ele("ext:ExtensionContent")
		.up()
		.up()
		.up();

	// UBL Version
	doc
		.ele("cbc:UBLVersionID")
		.txt(data.ublVersionId || UBL_VERSION)
		.up();
	doc
		.ele("cbc:CustomizationID")
		.txt(data.customizationId || CUSTOMIZATION_ID)
		.up();

	// Credit Note ID
	doc.ele("cbc:ID").txt(data.id).up();

	// Issue Date
	doc.ele("cbc:IssueDate").txt(formatDate(data.issueDate)).up();

	// Credit Note Type Code
	doc.ele("cbc:CreditNoteTypeCode").txt(data.creditNoteTypeCode).up();

	// Note (reason)
	if (data.note) {
		doc.ele("cbc:Note").txt(data.note).up();
	}

	// Document Currency Code
	doc.ele("cbc:DocumentCurrencyCode").txt(data.documentCurrencyCode).up();

	// Discrepancy Response (Reason for credit note)
	const discrepancy = doc.ele("cac:DiscrepancyResponse");
	discrepancy.ele("cbc:ReferenceID").txt(originalDocumentId).up();
	discrepancy
		.ele("cbc:ResponseCode")
		.txt(data.discrepancyResponse.responseCode)
		.up();
	discrepancy
		.ele("cbc:Description")
		.txt(data.discrepancyResponse.description)
		.up();
	discrepancy.up();

	// Billing Reference (original invoice)
	const billingRef = doc.ele("cac:BillingReference");
	const invoiceRef = billingRef.ele("cac:InvoiceDocumentReference");
	invoiceRef.ele("cbc:ID").txt(originalDocumentId).up();
	invoiceRef
		.ele("cbc:IssueDate")
		.txt(formatDate(data.billingReference.invoiceDocumentReference.issueDate))
		.up();
	invoiceRef.up();
	billingRef.up();

	// Supplier
	const supplierParty = doc.ele("cac:AccountingSupplierParty");
	createPartyElement(supplierParty, "cac", supplier);
	supplierParty.up();

	// Customer
	const customerParty = doc.ele("cac:AccountingCustomerParty");
	createPartyElement(customerParty, "cac", data.customer);
	customerParty.up();

	// Tax Totals (same as invoice)
	data.taxTotals.forEach((taxTotal) => {
		const taxTotalElement = doc.ele("cac:TaxTotal");
		createAmountElement(
			taxTotalElement,
			"cbc",
			"TaxAmount",
			taxTotal.taxAmount,
			data.documentCurrencyCode,
		);
		taxTotalElement.up();
	});

	// Legal Monetary Total
	const monetaryTotal = doc.ele("cac:LegalMonetaryTotal");
	createAmountElement(
		monetaryTotal,
		"cbc",
		"PayableAmount",
		data.legalMonetaryTotal.payableAmount,
		data.documentCurrencyCode,
	);
	monetaryTotal.up();

	// Credit Note Lines (similar to invoice lines)
	data.invoiceLines.forEach((line) => {
		const lineElement = doc.ele("cac:CreditNoteLine");
		lineElement.ele("cbc:ID").txt(line.id).up();

		lineElement
			.ele("cbc:CreditedQuantity")
			.att("unitCode", line.unitCode)
			.txt(String(line.quantity))
			.up();

		createAmountElement(
			lineElement,
			"cbc",
			"LineExtensionAmount",
			line.lineExtensionAmount,
			data.documentCurrencyCode,
		);

		const itemElement = lineElement.ele("cac:Item");
		itemElement.ele("cbc:Description").txt(line.description).up();
		itemElement.up();

		const priceElement = lineElement.ele("cac:Price");
		createAmountElement(
			priceElement,
			"cbc",
			"PriceAmount",
			line.unitPrice,
			data.documentCurrencyCode,
		);
		priceElement.up();

		lineElement.up();
	});

	const xml = doc.end({ prettyPrint: true });
	const hash = crypto.createHash("sha256").update(xml).digest("hex");
	const fileName = generateXmlFileName(
		data.supplier.ruc,
		"07",
		series,
		correlative,
	);

	return { xml, hash, fileName };
}
