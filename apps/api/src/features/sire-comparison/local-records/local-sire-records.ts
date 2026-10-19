/**
 * Maps the company's own books (sales invoices, purchase bills) to the record
 * shape the web SIRE reconciliation compares against SUNAT's RVIE/RCE files.
 *
 * Amounts are integer cents parsed from the DB decimal strings, never floats.
 * Document key fields follow the SUNAT layouts: in RVIE the issuer is the
 * declaring company; in RCE it is the supplier.
 */

export type SireBookKind = "RVIE" | "RCE";

export interface LocalSireRecord {
	periodo: string;
	caratula: SireBookKind;
	rucEmisor: string;
	razonSocial: string;
	tipoComprobante: string;
	serie: string;
	numero: string;
	fechaEmision: string;
	moneda: string;
	baseImponible: number;
	igv: number;
	total: number;
	estado: "ACTIVO" | "ANULADO";
	origen: "ARKELYTHEX";
}

export interface SalesBookRow {
	series: string;
	correlative: number;
	issueDate: Date;
	currency: string;
	subtotal: string;
	igvAmount: string;
	totalAmount: string;
	status: string;
	customerName: string | null;
}

export interface PurchaseBookRow {
	billNumber: string;
	issueDate: Date;
	currency: string;
	subtotalAmount: string;
	igvAmount: string;
	totalAmount: string;
	status: string;
	vendorTaxId: string | null;
	vendorName: string | null;
}

const MONEY = /^(-?)(\d{1,13})(?:\.(\d{1,2}))?$/;
const PERIOD = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Converts a DB decimal string (scale ≤ 2) to integer cents. */
export function decimalToCents(value: string | null | undefined): number {
	if (value === null || value === undefined) return 0;
	const match = MONEY.exec(value.trim());
	if (!match) throw new Error(`monto inválido: "${value}"`);
	const [, sign, units, decimals = ""] = match;
	const cents = Number(units) * 100 + Number(decimals.padEnd(2, "0"));
	return sign === "-" ? -cents : cents;
}

/** SUNAT series starting with B are boletas (03); F/E series are facturas (01). */
export function documentTypeFromSeries(series: string): string {
	return series.trim().toUpperCase().startsWith("B") ? "03" : "01";
}

/** UTC month window `[start, end)` for a `YYYY-MM` period. */
export function periodBounds(period: string): { start: Date; end: Date } {
	const match = PERIOD.exec(period);
	if (!match) throw new Error(`periodo inválido: "${period}"`);
	const year = Number(match[1]);
	const month = Number(match[2]);
	return {
		start: new Date(Date.UTC(year, month - 1, 1)),
		end: new Date(Date.UTC(year, month, 1)),
	};
}

function toSirePeriod(period: string): string {
	return period.replace("-", "");
}

function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function toEstado(status: string): LocalSireRecord["estado"] {
	return status === "CANCELLED" ? "ANULADO" : "ACTIVO";
}

/** Sales invoice → RVIE record. `companyRuc` is the declaring company. */
export function toSalesRecord(
	row: SalesBookRow,
	period: string,
	companyRuc: string,
): LocalSireRecord {
	return {
		periodo: toSirePeriod(period),
		caratula: "RVIE",
		rucEmisor: companyRuc,
		razonSocial: row.customerName ?? "",
		tipoComprobante: documentTypeFromSeries(row.series),
		serie: row.series,
		numero: String(row.correlative),
		fechaEmision: toIsoDate(row.issueDate),
		moneda: row.currency,
		baseImponible: decimalToCents(row.subtotal),
		igv: decimalToCents(row.igvAmount),
		total: decimalToCents(row.totalAmount),
		estado: toEstado(row.status),
		origen: "ARKELYTHEX",
	};
}

/** Purchase bill (`SERIE-NUMERO`) → RCE record keyed by the supplier's RUC. */
export function toPurchaseRecord(
	row: PurchaseBookRow,
	period: string,
): LocalSireRecord {
	const separator = row.billNumber.indexOf("-");
	const serie = separator >= 0 ? row.billNumber.slice(0, separator) : "";
	const numero =
		separator >= 0 ? row.billNumber.slice(separator + 1) : row.billNumber;
	return {
		periodo: toSirePeriod(period),
		caratula: "RCE",
		rucEmisor: row.vendorTaxId ?? "",
		razonSocial: row.vendorName ?? "",
		tipoComprobante: documentTypeFromSeries(serie),
		serie,
		numero,
		fechaEmision: toIsoDate(row.issueDate),
		moneda: row.currency,
		baseImponible: decimalToCents(row.subtotalAmount),
		igv: decimalToCents(row.igvAmount),
		total: decimalToCents(row.totalAmount),
		estado: toEstado(row.status),
		origen: "ARKELYTHEX",
	};
}
