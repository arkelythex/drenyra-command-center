/**
 * UBL 2.1 Constants for SUNAT 2026
 * Based on official SUNAT documentation
 *
 * Sources:
 * - https://cpe.sunat.gob.pe/
 * - Guía XML Factura UBL 2.1
 * UBL version used for SUNAT documents.
 *
 * @example
 * ```ts
 * console.log(UBL_VERSION); // "2.1"
 * ```
 */

export const UBL_VERSION = "2.1";

/**
 * CustomizationId used by SUNAT for UBL 2.1 documents.
 *
 * @example
 * ```ts
 * console.log(CUSTOMIZATION_ID); // "2.0"
 * ```
 */
export const CUSTOMIZATION_ID = "2.0";

/**
 * Document Types (Tipo de Comprobante)
 *
 * @example
 * ```ts
 * const facturaCode = DOCUMENT_TYPES.FACTURA; // "01"
 * ```
 */
export const DOCUMENT_TYPES = {
	FACTURA: "01",
	BOLETA: "03",
	NOTA_CREDITO: "07",
	NOTA_DEBITO: "08",
} as const;

/**
 * Tax Types (Tributos)
 *
 * @example
 * ```ts
 * const igvTaxType = TAX_TYPES.IGV; // "1000"
 * ```
 */
export const TAX_TYPES = {
	IGV: "1000", // Impuesto General a las Ventas
	ISC: "2000", // Impuesto Selectivo al Consumo
	OTROS: "9999",
} as const;

/**
 * Tax Categories (Categorías de IGV)
 *
 * @example
 * ```ts
 * const gravado = TAX_CATEGORIES.GRAVADO; // "S"
 * ```
 */
export const TAX_CATEGORIES = {
	GRAVADO: "S", // Gravado - Operación Onerosa
	EXONERADO: "E", // Exonerado - Operación Onerosa
	INAFECTO: "O", // Inafecto - Operación Onerosa
	EXPORTACION: "G", // Exportación
	GRATUITO: "Z", // Gratuito
} as const;

/**
 * IGV Rate (2026)
 *
 * @example
 * ```ts
 * const rate = IGV_RATE; // 18
 * ```
 */
export const IGV_RATE = 18.0;

/**
 * IGV rate as a decimal fraction (e.g., 0.18).
 *
 * @example
 * ```ts
 * const rate = IGV_DECIMAL; // 0.18
 * ```
 */
export const IGV_DECIMAL = 0.18;

/**
 * Currency Codes (ISO 4217)
 *
 * @example
 * ```ts
 * const pen = CURRENCIES.PEN; // "PEN"
 * ```
 */
export const CURRENCIES = {
	PEN: "PEN", // Soles
	USD: "USD", // Dólares
	EUR: "EUR", // Euros
} as const;

/**
 * Unit of Measure Codes (SUNAT)
 *
 * @example
 * ```ts
 * const unit = UNIT_CODES.UNIDAD; // "NIU"
 * ```
 */
export const UNIT_CODES = {
	UNIDAD: "NIU", // Unidad (pieza)
	KILOGRAMO: "KGM",
	METRO: "MTR",
	LITRO: "LTR",
	CAJA: "BX",
	SERVICIO: "ZZ", // Servicio
} as const;

/**
 * Payment Terms Codes
 *
 * @example
 * ```ts
 * const term = PAYMENT_TERMS.CONTADO; // "Contado"
 * ```
 */
export const PAYMENT_TERMS = {
	CONTADO: "Contado",
	CREDITO: "Credito",
} as const;

/**
 * XML Namespaces (UBL 2.1)
 *
 * @example
 * ```ts
 * const cbc = XML_NAMESPACES.cbc;
 * ```
 */
export const XML_NAMESPACES = {
	invoice: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
	creditNote: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
	debitNote: "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2",
	cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
	cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
	ds: "http://www.w3.org/2000/09/xmldsig#",
	ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
} as const;

/**
 * Schema Locations
 *
 * @example
 * ```ts
 * const invoiceLocation = SCHEMA_LOCATIONS.invoice;
 * ```
 */
export const SCHEMA_LOCATIONS = {
	invoice:
		"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd",
	creditNote:
		"urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2 http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-CreditNote-2.1.xsd",
} as const;

/**
 * Detraction Threshold (SPOT)
 * Detracciones aplican para servicios > S/ 700
 *
 * @example
 * ```ts
 * const threshold = DETRACTION_THRESHOLD; // 700
 * ```
 */
export const DETRACTION_THRESHOLD = 700;

/**
 * Default detraction rate used in simplified calculations (12%).
 *
 * @example
 * ```ts
 * const rate = DETRACTION_RATE; // 0.12
 * ```
 */
export const DETRACTION_RATE = 0.12; // 12%

/**
 * Series Format Validation
 * Serie debe ser 4 caracteres alfanuméricos
 *
 * @example
 * ```ts
 * SERIES_REGEX.test("F001"); // true
 * ```
 */
export const SERIES_REGEX = /^[A-Z0-9]{4}$/;

/**
 * Maximum numeric length for a correlative (8 digits).
 *
 * @example
 * ```ts
 * const max = CORRELATIVE_MAX_LENGTH; // 8
 * ```
 */
export const CORRELATIVE_MAX_LENGTH = 8;

/**
 * Document Type Codes (Tipo de Documento de Identidad)
 *
 * @example
 * ```ts
 * const rucType = ID_DOCUMENT_TYPES.RUC; // "6"
 * ```
 */
export const ID_DOCUMENT_TYPES = {
	DNI: "1",
	RUC: "6",
	PASSPORT: "7",
	CARNET_EXTRANJERIA: "4",
} as const;
