/**
 * Shared types and sort helper for the SUNAT compliance dashboard.
 */

export interface SunatInvoice {
	id: string;
	serieNumero: string;
	tipo: string;
	cliente: string;
	monto: number;
	fechaEmision: string;
	estado: string | null;
}

export interface TaxObligation {
	id: string;
	label: string;
	fechaVencimiento: string;
	status: "al-dia" | "por-vencer" | "vencido";
}

export type Period = "2026-01" | "2026-02" | "2026-03" | "2026-04";

export type SortKey =
	| "serieNumero"
	| "tipo"
	| "cliente"
	| "monto"
	| "fechaEmision"
	| "estado";

export type SortDir = "asc" | "desc";

/**
 * Returns a sorted copy of the invoices array.
 */
export function sortInvoices(
	invoices: SunatInvoice[],
	key: SortKey,
	dir: SortDir,
): SunatInvoice[] {
	return [...invoices].sort((a, b) => {
		const aVal = a[key];
		const bVal = b[key];

		if (aVal == null) return 1;
		if (bVal == null) return -1;

		if (typeof aVal === "number" && typeof bVal === "number") {
			return dir === "asc" ? aVal - bVal : bVal - aVal;
		}

		const cmp = String(aVal).localeCompare(String(bVal), "es");
		return dir === "asc" ? cmp : -cmp;
	});
}
