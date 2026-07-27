/**
 * PLE Domain Types
 *
 * Tipos para el Programa de Libros Electrónicos (PLE) de SUNAT.
 * Formato 5.1 — fixed-width text con campos separados por |.
 */

/** Tipos de libro electrónico. */
export type PleBookType = "LE-DIARIO" | "LE-MAYOR" | "LE-COMPRAS" | "LE-VENTAS";

/** Estados del ciclo de vida de una generación PLE. */
export type PleGenerationStatus =
	| "generated"
	| "validated"
	| "validation_failed"
	| "filed";

/** Resultado de una generación PLE. */
export interface PleGenerationResult {
	generationId: string;
	bookType: PleBookType;
	period: string; // YYYY-MM
	ruc: string;
	status: PleGenerationStatus;
	cdrHash?: string;
	downloadUrl?: string;
	fileSizeBytes?: number;
}

/** Error de validación PLE. */
export interface PleValidationError {
	field: string;
	message: string;
	line?: number;
}

/** Resultado de validación PLE. */
export interface PleValidationResult {
	valid: boolean;
	errors: PleValidationError[];
}

// ── Record Types (para los formatters) ─────────────────────────────────────

/** Registro del Libro Diario. */
export interface PleDiarioRecord {
	period: string; // MM
	fiscalYear: string; // YYYY
	ruc: string;
	voucherNumber: string;
	operationCode: string; // 01=Apertura, 02=Regular, 03=Ajuste, 04=Cierre
	voucherDate: string; // DD/MM/YYYY
	operationDate: string; // DD/MM/YYYY
	accountCode: string; // PCGE
	accountDescription: string;
	currencyCode: string; // 01=PEN, 02=USD
	debitCents: string; // 12 dígitos
	creditCents: string; // 12 dígitos
	glCurrencyCode: string; // 01=PEN
	glDebitCents: string; // 12 dígitos
	glCreditCents: string; // 12 dígitos
	transactionType: string;
	gloss: string;
	documentType: string;
	documentNumber: string;
	documentDate: string; // DD/MM/YYYY
	state: string; // 1=active, 0=anulado
}

/** Registro del Libro Mayor. */
export interface PleMayorRecord {
	period: string; // MM
	fiscalYear: string; // YYYY
	ruc: string;
	accountCode: string;
	accountDescription: string;
	openingDebitCents: string;
	openingCreditCents: string;
	monthlyDebitsCents: string;
	monthlyCreditsCents: string;
	closingDebitCents: string;
	closingCreditCents: string;
	state: string;
}

/** Registro de Compras. */
export interface PleComprasRecord {
	period: string;
	fiscalYear: string;
	ruc: string;
	operationDate: string; // DD/MM/YYYY
	issueDate: string;
	dueDate: string;
	documentType: string; // 01=Factura, 03=Boleta, 07=NC, 08=ND
	documentSeries: string;
	documentNumber: string;
	supplierRuc: string;
	supplierName: string;
	taxablePurchases: string; // cents
	igvBase: string;
	igvAmount: string;
	nonTaxablePurchases: string;
	totalPurchases: string;
	iscAmount: string;
	detractionAmount: string;
	retentionAmount: string;
	totalAmount: string;
	currencyCode: string;
	exchangeRate: string; // x10000
	state: string;
}

/** Registro de Ventas. */
export interface PleVentasRecord {
	period: string;
	fiscalYear: string;
	ruc: string;
	operationDate: string; // DD/MM/YYYY
	issueDate: string;
	dueDate: string;
	documentType: string; // 01=Factura, 03=Boleta, 07=NC, 08=ND
	documentSeries: string;
	documentNumber: string;
	customerRuc: string;
	customerName: string;
	taxableSales: string; // cents
	igvBase: string;
	igvAmount: string;
	exports: string;
	nonTaxableSales: string;
	iscAmount: string;
	discounts: string;
	totalAmount: string;
	currencyCode: string;
	exchangeRate: string;
	state: string;
}
