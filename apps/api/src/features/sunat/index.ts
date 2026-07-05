/**
 * SUNAT Feature Module
 *
 * This module provides comprehensive functionality for electronic invoicing
 * compliance with SUNAT (Superintendencia Nacional de Aduanas y de Administración Tributaria)
 * according to Peruvian tax regulations.
 *
 * Features:
 * - UBL 2.1 XML generation for invoices and credit notes
 * - Digital signature using XAdES-EPES format
 * - Certificate management (PFX/PEM)
 * - ZIP packaging for SUNAT submission
 * - Type-safe interfaces for all data structures
 *
 * @module sunat
 * @example
 * ```typescript
 * import {
 *   generateInvoiceXml,
 *   signXml,
 *   loadCertificateFromPfx,
 *   generateAndSignInvoice,
 *   DOCUMENT_TYPES,
 *   type InvoiceData,
 * } from '@/features/sunat';
 *
 * // Load certificate
 * const cert = loadCertificateFromPfx('/path/to/cert.pfx', 'password');
 *
 * // Generate and sign invoice
 * const result = await generateAndSignInvoice(invoiceData, cert, '/output/dir');
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
	/** Address information for parties */
	Address,
	/** Credit note data structure extending invoice base */
	CreditNoteData,
	/** Complete invoice data structure for UBL 2.1 generation */
	InvoiceData,
	/** Individual line item in an invoice */
	InvoiceLineItem,
	/** Legal monetary total amounts */
	LegalMonetaryTotal,
	/** Supplier or customer party information */
	Party,
	/** Payment terms (contado/credito) */
	PaymentTerms,
	/** Tax total with subtotals breakdown */
	TaxTotal,
	/** Result of XML generation with hash and filename */
	XmlGenerationResult,
} from "./types/ubl.types";

// ============================================================================
// Constants
// ============================================================================

export {
	/** Currency codes (PEN, USD, EUR) */
	CURRENCIES,
	/** Customization ID constant */
	CUSTOMIZATION_ID,
	/** Detraction threshold amount (700 PEN) */
	DETRACTION_THRESHOLD,
	/** Document type codes (01=Factura, 03=Boleta, 07=Nota Crédito, 08=Nota Débito) */
	DOCUMENT_TYPES,
	/** Identity document types (DNI=1, RUC=6, etc.) */
	ID_DOCUMENT_TYPES,
	/** IGV rate (18.00 for 2026) */
	IGV_RATE,
	/** Payment terms codes (Contado, Credito) */
	PAYMENT_TERMS,
	/** Schema locations for XML validation */
	SCHEMA_LOCATIONS,
	/** Tax categories (S=Gravado, E=Exonerado, O=Inafecto, G=Exportación, Z=Gratuito) */
	TAX_CATEGORIES,
	/** Tax type codes (1000=IGV, 2000=ISC, 9999=Otros) */
	TAX_TYPES,
	/** UBL version constant */
	UBL_VERSION,
	/** Unit of measure codes (NIU, KGM, MTR, etc.) */
	UNIT_CODES,
	/** XML namespace URIs for UBL 2.1 documents */
	XML_NAMESPACES,
} from "./constants/ubl-constants";

// ============================================================================
// Certificate Handler
// ============================================================================

export {
	/** Certificate data structure with keys and metadata */
	type Certificate,
	/** Get certificate info for display/logging */
	getCertificateInfo,
	/** Load certificate from separate PEM files */
	loadCertificateFromPem,
	/** Load certificate from PFX/P12 file and convert to PEM */
	loadCertificateFromPfx,
	/** Validate certificate validity period */
	validateCertificate,
} from "./signature/certificate.handler";

// ============================================================================
// XML Signer
// ============================================================================

export {
	/** Extract signature value from signed XML for debugging */
	extractSignatureValue,
	/** Sign XML with digital certificate using XAdES-EPES */
	signXml,
	/** Validate XML signature against public certificate */
	validateXmlSignature,
} from "./signature/xml-signer";

// ============================================================================
// Invoice Signer Service
// ============================================================================

export {
	/** Batch sign multiple invoices */
	batchSignInvoices,
	/** Generate and sign credit note, optionally save to file */
	generateAndSignCreditNote,
	/** Generate and sign invoice, optionally save to file */
	generateAndSignInvoice,
	/** Result of signed invoice generation */
	type SignedInvoiceResult,
} from "./signature/invoice-signer.service";

// ============================================================================
// UBL Generators
// ============================================================================

export {
	/** Generate UBL 2.1 Invoice XML from invoice data */
	generateInvoiceXml,
} from "./xml/invoice-ubl.generator";

// ============================================================================
// HTTP API Module (transitional verticalization)
// ============================================================================

export { sunatApiModule } from "./api.module";

export {
	/** Credit note reason codes (01-10) per SUNAT specification */
	CREDIT_NOTE_REASON_CODES,
	/** Generate UBL 2.1 Credit Note XML from credit note data */
	generateCreditNoteXml,
} from "./xml/credit-note-ubl.generator";

// ============================================================================
// XML Builder Helpers
// ============================================================================

export {
	/** Create amount element with currency attribute */
	createAmountElement,
	/** Create XML element with namespace */
	createElement,
	/** Create party element (supplier/customer) */
	createPartyElement,
	/** Format amount with 2 decimal places */
	formatAmount,
	/** Format date to YYYY-MM-DD */
	formatDate,
	/** Generate XML filename in SUNAT format: RUC-TipoDoc-Serie-Numero.xml */
	generateXmlFileName,
	/** Parse invoice ID into series and correlative */
	parseInvoiceId,
	/** Validate correlative format (numeric, max 8 digits) */
	validateCorrelative,
	/** Validate series format (4 alphanumeric characters) */
	validateSeries,
} from "./xml/xml-builder.helpers";
