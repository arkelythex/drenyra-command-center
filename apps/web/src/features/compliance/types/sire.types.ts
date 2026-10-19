export interface SireRecord {
	periodo: string;
	caratula: string;
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
	origen: "SUNAT" | "ARKELYTHEX";
}

export interface SireDiscrepancy {
	id: string;
	type:
		| "MISSING_IN_SUNAT"
		| "MISSING_IN_ARKELYTHEX"
		| "AMOUNT_MISMATCH"
		| "IGV_MISMATCH"
		| "CURRENCY_MISMATCH"
		| "STATUS_MISMATCH"
		| "DUPLICATE_DOCUMENT";
	severity: "HIGH" | "MEDIUM" | "LOW";
	recordSunat?: SireRecord;
	recordLocal?: SireRecord;
	diffAmount?: number;
}

export interface ReconciliationStats {
	totalSunat: number;
	totalLocal: number;
	matchCount: number;
	discrepancyCount: number;
	igvGap: number;
}

export type SireEntry = SireRecord;
export type SireStatus = SireRecord["estado"];

export const SIRE_DISCREPANCY_LABELS: Record<SireDiscrepancy["type"], string> =
	{
		MISSING_IN_ARKELYTHEX: "Omisión: Comprobante en SUNAT no registrado",
		MISSING_IN_SUNAT: "Riesgo: No figura en Portal SIRE",
		AMOUNT_MISMATCH: "Discrepancia: Diferencia de importes",
		IGV_MISMATCH: "Discrepancia: Diferencia de IGV",
		CURRENCY_MISMATCH: "Discrepancia: Moneda distinta",
		STATUS_MISMATCH: "Discrepancia: Estado (activo/anulado) distinto",
		DUPLICATE_DOCUMENT: "Alerta: Comprobante duplicado en la lista",
	};
