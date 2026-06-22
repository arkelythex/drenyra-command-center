/**
 * UBL 2.1 TypeScript Types
 * Type-safe invoice generation
 * Supplier/Customer Party
 *
 * @example
 * ```ts
 * const party: Party = { ruc: "20123456789", legalName: "ACME S.A.C.", address: { country: "PE" } };
 * ```
 */

export interface Party {
  ruc: string;
  documentType?: '1' | '6'; // 1=DNI, 6=RUC. Defaults to 6 for backward compatibility.
  legalName: string;
  tradeName?: string;
  address?: Address;
}

/**
 * Postal address representation for UBL party.
 *
 * @example
 * ```ts
 * const addr: Address = { country: "PE", cityName: "Lima" };
 * ```
 */
export interface Address {
  streetName?: string;
  cityName?: string;
  countrySubentity?: string; // Departamento
  district?: string;
  country: string; // PE
}

/**
 * Invoice Line Item
 *
 * @example
 * ```ts
 * const line: InvoiceLineItem = {
 *   id: "1",
 *   quantity: 1,
 *   unitCode: "NIU",
 *   description: "Servicio",
 *   unitPrice: 100,
 *   taxCategory: "S",
 *   lineExtensionAmount: 84.75,
 *   totalAmount: 100,
 * };
 * ```
 */
export interface InvoiceLineItem {
  id: string; // Line number
  quantity: number;
  unitCode: string; // NIU, KGM, etc.
  description: string;
  unitPrice: number;
  taxCategory: 'S' | 'E' | 'O' | 'G' | 'Z'; // Gravado, Exonerado, etc.
  lineExtensionAmount: number; // Subtotal sin IGV
  taxAmount?: number; // IGV amount
  totalAmount: number; // Total con IGV
}

/**
 * Tax Total
 *
 * @example
 * ```ts
 * const tax: TaxTotal = { taxAmount: 18, taxSubtotal: [] };
 * ```
 */
export interface TaxTotal {
  taxAmount: number;
  taxSubtotal: {
    taxableAmount: number;
    taxAmount: number;
    taxCategory: string;
    taxType: string; // 1000 = IGV
    taxRate: number; // 18.00
  }[];
}

/**
 * Legal Monetary Total
 *
 * @example
 * ```ts
 * const totals: LegalMonetaryTotal = { lineExtensionAmount: 100, taxInclusiveAmount: 118, payableAmount: 118 };
 * ```
 */
export interface LegalMonetaryTotal {
  lineExtensionAmount: number; // Subtotal
  taxInclusiveAmount: number; // Total con impuestos
  allowanceTotalAmount?: number; // Descuentos
  chargeTotalAmount?: number; // Cargos
  payableAmount: number; // Monto a pagar
}

/**
 * Payment Terms
 *
 * @example
 * ```ts
 * const terms: PaymentTerms = { paymentMeansCode: "Contado" };
 * ```
 */
export interface PaymentTerms {
  paymentMeansCode: 'Contado' | 'Credito';
  paymentDueDate?: string; // ISO 8601
}

/**
 * Complete Invoice Data
 *
 * @example
 * ```ts
 * const data = {
 *   id: "F001-00000001",
 *   issueDate: "2026-02-03",
 *   invoiceTypeCode: "01",
 *   documentCurrencyCode: "PEN",
 *   supplier: { ruc: "20123456789", legalName: "ACME S.A.C.", address: { country: "PE" } },
 *   customer: { ruc: "10456789012", legalName: "Cliente", address: { country: "PE" } },
 *   invoiceLines: [],
 *   taxTotals: [],
 *   legalMonetaryTotal: { lineExtensionAmount: 0, taxInclusiveAmount: 0, payableAmount: 0 },
 * } as InvoiceData;
 * ```
 */
export interface InvoiceData {
  // Identifiers
  id: string; // F001-00000001
  issueDate: string; // YYYY-MM-DD
  dueDate?: string;

  // Document type
  invoiceTypeCode: '01' | '03'; // 01=Factura, 03=Boleta

  // Currency
  documentCurrencyCode: 'PEN' | 'USD' | 'EUR';

  // Parties
  supplier: Party;
  customer: Party;

  // Items
  invoiceLines: InvoiceLineItem[];

  // Totals
  taxTotals: TaxTotal[];
  legalMonetaryTotal: LegalMonetaryTotal;

  // Payment
  paymentTerms?: PaymentTerms;

  // Notes
  note?: string;

  // UBL version
  ublVersionId?: string; // Default: 2.1
  customizationId?: string; // Default: 2.0
}

/**
 * Credit Note Data
 *
 * @example
 * ```ts
 * const data = { creditNoteTypeCode: "07" } as CreditNoteData;
 * ```
 */
export interface CreditNoteData extends Omit<InvoiceData, 'id' | 'invoiceTypeCode'> {
  id: string; // FC01-00000001
  creditNoteTypeCode: '07'; // Nota de Crédito

  // Reference to original invoice
  billingReference: {
    invoiceDocumentReference: {
      id: string; // F001-00000001
      issueDate: string;
    };
  };

  // Reason
  discrepancyResponse: {
    responseCode: string; // 01-13 (códigos SUNAT)
    description: string;
  };
}

/**
 * XML Generation Result
 *
 * @example
 * ```ts
 * const res: XmlGenerationResult = { xml: "<xml/>", hash: "sha256...", fileName: "20123456789-01-F001-00000001.xml" };
 * ```
 */
export interface XmlGenerationResult {
  xml: string;
  hash: string; // SHA-256 hash for signature
  fileName: string; // RUC-TipoDoc-Serie-Numero.xml
}
