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
		| "CURRENCY_MISMATCH";
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
