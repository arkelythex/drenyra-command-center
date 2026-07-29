/**
 * PLE Types — Programa de Libros Electrónicos
 *
 * Domain types for PLE book generation, validation, and SUNAT filing.
 */

/** SUNAT-defined PLE book types */
export type PleBookType = "LE-DIARIO" | "LE-MAYOR" | "LE-COMPRAS" | "LE-VENTAS";

/** PLE generation status lifecycle */
export type PleGenerationStatus =
	| "generated"
	| "validated"
	| "validation_failed"
	| "filed";

/** A single line in the generated PLE TXT file */
export interface PleTxtLine {
	/** Fixed-width or pipe-delimited columns */
	columns: string[];
}

/** Result of a PLE book generation */
export interface PleGenerationResult {
	id: string;
	bookType: PleBookType;
	period: string;
	ruc: string;
	status: PleGenerationStatus;
	fileContent: string | null;
	fileSizeBytes: number | null;
	cdrHash: string | null;
	generatedAt: string;
}

/** Input for generating a PLE book */
export interface GeneratePleBookInput {
	companyId: string;
	period: string;
	bookType: PleBookType;
}

/** Result of PLE book validation */
export interface PleValidationResult {
	valid: boolean;
	errors: PleValidationError[];
	warnings: PleValidationWarning[];
}

export interface PleValidationError {
	code: string;
	message: string;
	line?: number;
	field?: string;
}

export interface PleValidationWarning {
	code: string;
	message: string;
	line?: number;
}

/** A row of ledger data extracted for PLE generation */
export interface PleLedgerRow {
	date: string;
	gloss: string;
	accountCode: string;
	debitCents: number;
	creditCents: number;
}

/** Aggregated account data for LE-MAYOR */
export interface PleMayorRow {
	accountCode: string;
	description: string;
	balanceAnteriorCents: number;
	debitCents: number;
	creditCents: number;
	balanceActualCents: number;
}

/** Purchase register row for LE-COMPRAS */
export interface PleComprasRow {
	rucProveedor: string;
	razonSocial: string;
	tipoComprobante: string;
	serie: string;
	numero: string;
	fecha: string;
	baseCents: number;
	igvCents: number;
	totalCents: number;
}

/** Sales register row for LE-VENTAS */
export interface PleVentasRow {
	rucCliente: string;
	razonSocial: string;
	tipoComprobante: string;
	serie: string;
	numero: string;
	fecha: string;
	baseCents: number;
	igvCents: number;
	totalCents: number;
}

/** List books filter parameters */
export interface ListPleBooksParams {
	companyId: string;
	period?: string;
	bookType?: PleBookType;
}

/** SUNAT filename format: RUC + period + book code + .txt */
export interface PleFileName {
	filename: string;
	ruc: string;
	period: string;
	bookType: PleBookType;
}
