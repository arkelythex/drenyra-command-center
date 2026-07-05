/**
 * SIRE Types — Domain
 *
 * SUNAT Electronic Registers (Sistema Integrado de Registros Electrónicos).
 * All taxpayers must submit monthly purchase and sales registers in these
 * exact formats since January 2026 (R.S. N° 271-2013-SUNAT).
 *
 * @see {@link https://www.sunat.gob.pe/legislacion/superin/2013/271-2013.pdf}
 */

/**
 * Sales Register Record (Registro de Ventas).
 * 30 fields, pipe-delimited for SUNAT submission.
 *
 * Document types: 01=Factura, 03=Boleta, 07=NC, 08=ND
 * Period format: YYYYMM00 (e.g., "20260100")
 * Amount format: 0.00 (2 decimals)
 */
export interface SIRESalesRecord {
	periodo: string;
	correlativo: string;
	fechaEmision: string;
	tipoComprobante: string;
	serie: string;
	numero: string;
	numeroFinal: string;
	tipoDocumentoCliente: string;
	numeroDocumentoCliente: string;
	razonSocialCliente: string;
	valorExportacion: number;
	baseImponibleOGravada: number;
	descuentoBaseImponible: number;
	igv: number;
	descuentoIGV: number;
	importeExonerado: number;
	importeInafecto: number;
	isc: number;
	baseImponibleIVAP: number;
	ivap: number;
	icbper: number;
	otrosTributos: number;
	totalComprobante: number;
	tipoMoneda: string;
	tipoCambio: number;
	fechaEmisionModificado: string;
	tipoComprobanteModificado: string;
	serieModificado: string;
	numeroModificado: string;
	estado: string;
}

/**
 * Purchases Register Record (Registro de Compras).
 * 35 fields, pipe-delimited for SUNAT submission.
 *
 * Includes detraction/retention fields and DUA (customs) support.
 */
export interface SIREPurchasesRecord {
	periodo: string;
	correlativo: string;
	fechaEmision: string;
	fechaVencimiento: string;
	tipoComprobante: string;
	serie: string;
	anoDUA: string;
	numeroComprobante: string;
	numeroFinal: string;
	tipoDocumentoProveedor: string;
	numeroDocumentoProveedor: string;
	razonSocialProveedor: string;
	baseImponible: number;
	igv: number;
	baseImponibleNoGravada: number;
	igvNoGravado: number;
	baseImponibleNoGravadaNG: number;
	igvNoGravadoNG: number;
	valorAdquisicionesNG: number;
	isc: number;
	icbper: number;
	otrosTributos: number;
	totalComprobante: number;
	tipoMoneda: string;
	tipoCambio: number;
	fechaEmisionModificado: string;
	tipoComprobanteModificado: string;
	serieModificado: string;
	numeroDUAModificado: string;
	numeroModificado: string;
	fechaDetraccion: string;
	numeroDetraccion: string;
	retencion: string;
	estado: string;
	clasificacionBienes: string;
}

/** SIRE export format options. */
export interface SIREExportOptions {
	year: number;
	month: number;
	companyId: string;
	format: "TXT" | "EXCEL";
	includeHeader?: boolean;
}

/** SIRE validation result. */
export interface SIREValidationResult {
	isValid: boolean;
	errors: Array<{ line: number; field: string; message: string }>;
	warnings: Array<{ line: number; field: string; message: string }>;
	recordCount: number;
}

/** SIRE summary statistics. */
export interface SIRESummary {
	period: string;
	recordCount: number;
	totalAmount: number;
	totalIGV: number;
	currency: string;
	generatedAt: Date;
}

/** SUNAT live ledger summary by register type. */
export interface SIRESunatLiveLedgerSummary {
	ledgerType: "ventas" | "compras";
	recordCount: number;
	totalAmount: number;
	totalIGV: number;
}

/** Reason a live SUNAT summary is unavailable. */
export type SIRESunatLiveUnavailableReason =
	| "missing_config"
	| "api_mode_disabled"
	| "auth_unavailable"
	| "timeout"
	| "upstream_error"
	| "invalid_payload"
	| "internal_error";

/** Base type for SUNAT live summary results. */
interface SIRESunatLiveSummaryBase {
	source: "sunat-api";
	period: string;
	checkedAt: string;
}

/** Live SUNAT data available. */
export interface SIRESunatLiveSummaryAvailable
	extends SIRESunatLiveSummaryBase {
	status: "available";
	message: string;
	ledgers: SIRESunatLiveLedgerSummary[];
}

/** Live SUNAT data unavailable. */
export interface SIRESunatLiveSummaryUnavailable
	extends SIRESunatLiveSummaryBase {
	status: "unavailable";
	reason: SIRESunatLiveUnavailableReason;
	message: string;
	ledgers: [];
}

/** Union of available/unavailable SUNAT live summaries. */
export type SIRESunatLiveSummary =
	| SIRESunatLiveSummaryAvailable
	| SIRESunatLiveSummaryUnavailable;
