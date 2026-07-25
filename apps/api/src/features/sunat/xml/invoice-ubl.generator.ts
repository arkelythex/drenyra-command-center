/**
 * UBL 2.1 Invoice XML Generator
 * Generates SUNAT-compliant XML for electronic invoices
 *
 * Based on: Guía XML Factura UBL 2.1 - SUNAT 2026
 */

import crypto from "node:crypto";
import { create } from "xmlbuilder2";
import {
	CUSTOMIZATION_ID,
	SCHEMA_LOCATIONS,
	UBL_VERSION,
	XML_NAMESPACES,
} from "../constants/ubl-constants";
import type { InvoiceData, XmlGenerationResult } from "../types/ubl.types";
import {
	createAmountElement,
	createPartyElement,
	formatAmount,
	formatDate,
	generateXmlFileName,
	parseInvoiceId,
	validatePartyDocument,
} from "./xml-builder.helpers";

/**
 * Generate UBL 2.1 Invoice XML.
 *
 * @param data - Invoice data payload for UBL generation
 * @returns XML, hash (sha256) and file name
 * @throws {Error} If invoice id or RUC formats are invalid
 *
 * @example
 * ```ts
 * const res = generateInvoiceXml({ id: "F001-00000001" } as InvoiceData);
 * console.log(res.fileName);
 * ```
 */
export function generateInvoiceXml(data: InvoiceData): XmlGenerationResult {
	// Validate and parse invoice ID
	const { series, correlative } = parseInvoiceId(data.id);
	const supplier = { ...data.supplier, documentType: "6" as const };

	if (!validatePartyDocument(supplier.ruc, supplier.documentType)) {
		throw new Error(`Invalid RUC for supplier: ${supplier.ruc}`);
	}

	if (!validatePartyDocument(data.customer.ruc, data.customer.documentType)) {
		throw new Error(
			`Invalid document number for customer: ${data.customer.ruc}`,
		);
	}

	if (data.invoiceTypeCode === "01" && data.customer.documentType === "1") {
		throw new Error("Factura customers must use RUC document type");
	}

	// Create root Invoice element with namespaces
	const doc = create({ version: "1.0", encoding: "UTF-8", standalone: false })
		.ele(XML_NAMESPACES.invoice, "Invoice")
		.att("xmlns:cac", XML_NAMESPACES.cac)
		.att("xmlns:cbc", XML_NAMESPACES.cbc)
		.att("xmlns:ds", XML_NAMESPACES.ds)
		.att("xmlns:ext", XML_NAMESPACES.ext)
		.att("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
		.att("xsi:schemaLocation", SCHEMA_LOCATIONS.invoice);

	// UBL Extensions (for digital signature - will be added by signer)
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

	// Invoice ID
	doc.ele("cbc:ID").txt(data.id).up();

	// Issue Date
	doc.ele("cbc:IssueDate").txt(formatDate(data.issueDate)).up();

	// Due Date (if applicable)
	if (data.dueDate) {
		doc.ele("cbc:DueDate").txt(formatDate(data.dueDate)).up();
	}

	// Invoice Type Code (01=Factura, 03=Boleta)
	doc.ele("cbc:InvoiceTypeCode").txt(data.invoiceTypeCode).up();

	// Note (optional)
	if (data.note) {
		doc.ele("cbc:Note").txt(data.note).up();
	}

	// Document Currency Code
	doc.ele("cbc:DocumentCurrencyCode").txt(data.documentCurrencyCode).up();

	// Supplier (AccountingSupplierParty)
	const supplierParty = doc.ele("cac:AccountingSupplierParty");
	createPartyElement(supplierParty, "cac", supplier);
	supplierParty.up();

	// Customer (AccountingCustomerParty)
	const customerParty = doc.ele("cac:AccountingCustomerParty");
	createPartyElement(customerParty, "cac", data.customer);
	customerParty.up();

	// Payment Terms (if applicable)
	if (data.paymentTerms) {
		const paymentTermsElement = doc.ele("cac:PaymentTerms");
		paymentTermsElement
			.ele("cbc:ID")
			.txt(data.paymentTerms.paymentMeansCode)
			.up();
		if (data.paymentTerms.paymentDueDate) {
			paymentTermsElement
				.ele("cbc:PaymentDueDate")
				.txt(formatDate(data.paymentTerms.paymentDueDate))
				.up();
		}
		paymentTermsElement.up();
	}

	// Tax Totals
	data.taxTotals.forEach((taxTotal) => {
		const taxTotalElement = doc.ele("cac:TaxTotal");
		createAmountElement(
			taxTotalElement,
			"cbc",
			"TaxAmount",
			taxTotal.taxAmount,
			data.documentCurrencyCode,
		);

		taxTotal.taxSubtotal.forEach((subtotal) => {
			const subtotalElement = taxTotalElement.ele("cac:TaxSubtotal");
			createAmountElement(
				subtotalElement,
				"cbc",
				"TaxableAmount",
				subtotal.taxableAmount,
				data.documentCurrencyCode,
			);
			createAmountElement(
				subtotalElement,
				"cbc",
				"TaxAmount",
				subtotal.taxAmount,
				data.documentCurrencyCode,
			);

			const categoryElement = subtotalElement.ele("cac:TaxCategory");
			categoryElement.ele("cbc:ID").txt(subtotal.taxCategory).up();
			categoryElement
				.ele("cbc:Percent")
				.txt(formatAmount(subtotal.taxRate))
				.up();

			const taxSchemeElement = categoryElement.ele("cac:TaxScheme");
			taxSchemeElement.ele("cbc:ID").txt(subtotal.taxType).up();
			taxSchemeElement.ele("cbc:Name").txt("IGV").up();
			taxSchemeElement.ele("cbc:TaxTypeCode").txt("VAT").up();
			taxSchemeElement.up();

			categoryElement.up();
			subtotalElement.up();
		});

		taxTotalElement.up();
	});

	// Legal Monetary Total
	const monetaryTotal = doc.ele("cac:LegalMonetaryTotal");
	createAmountElement(
		monetaryTotal,
		"cbc",
		"LineExtensionAmount",
		data.legalMonetaryTotal.lineExtensionAmount,
		data.documentCurrencyCode,
	);
	createAmountElement(
		monetaryTotal,
		"cbc",
		"TaxInclusiveAmount",
		data.legalMonetaryTotal.taxInclusiveAmount,
		data.documentCurrencyCode,
	);
	createAmountElement(
		monetaryTotal,
		"cbc",
		"PayableAmount",
		data.legalMonetaryTotal.payableAmount,
		data.documentCurrencyCode,
	);
	monetaryTotal.up();

	// Invoice Lines
	data.invoiceLines.forEach((line) => {
		const lineElement = doc.ele("cac:InvoiceLine");
		lineElement.ele("cbc:ID").txt(line.id).up();

		// Quantity
		lineElement
			.ele("cbc:InvoicedQuantity")
			.att("unitCode", line.unitCode)
			.txt(formatAmount(line.quantity))
			.up();

		// Line Extension Amount (subtotal sin IGV)
		createAmountElement(
			lineElement,
			"cbc",
			"LineExtensionAmount",
			line.lineExtensionAmount,
			data.documentCurrencyCode,
		);

		// Pricing
		const pricingElement = lineElement.ele("cac:PricingReference");
		const altPriceElement = pricingElement.ele("cac:AlternativeConditionPrice");
		createAmountElement(
			altPriceElement,
			"cbc",
			"PriceAmount",
			line.totalAmount / line.quantity,
			data.documentCurrencyCode,
		);
		altPriceElement.ele("cbc:PriceTypeCode").txt("01").up(); // 01 = Precio unitario
		altPriceElement.up();
		pricingElement.up();

		// Tax Total (line level)
		if (line.taxAmount) {
			const lineTaxTotal = lineElement.ele("cac:TaxTotal");
			createAmountElement(
				lineTaxTotal,
				"cbc",
				"TaxAmount",
				line.taxAmount,
				data.documentCurrencyCode,
			);
			lineTaxTotal.up();
		}

		// Item
		const itemElement = lineElement.ele("cac:Item");
		itemElement.ele("cbc:Description").txt(line.description).up();
		itemElement.up();

		// Price
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

	// Generate XML string
	const xml = doc.end({ prettyPrint: true });

	// Calculate hash for signature
	const hash = crypto.createHash("sha256").update(xml).digest("hex");

	// Generate file name
	const fileName = generateXmlFileName(
		data.supplier.ruc,
		data.invoiceTypeCode,
		series,
		correlative,
	);

	return { xml, hash, fileName };
}
