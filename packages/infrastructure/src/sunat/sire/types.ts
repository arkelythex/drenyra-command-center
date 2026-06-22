import { type Currency } from "@arkelythex/domain";

export type SireRegisterType = "COMPRAS" | "VENTAS";

export interface SireSyncRequest {
	organizationId: number;
	ruc: string;
	periodo: string;
	tipo: SireRegisterType;
}

export interface SireSyncStatus {
	ticket: string;
	estado: "PENDIENTE" | "PROCESANDO" | "LISTO" | "ERROR";
	mensaje?: string;
	progreso?: number;
	registros?: number;
	archivoDisponible?: boolean;
}

export interface SireRecord {
	periodo: string;
	correlativo: string;
	fechaEmision: Date;
	tipoComprobante: string;
	serie: string;
	numero: string;
	tipoDocIdentidad: string;
	numeroDocIdentidad: string;
	razonSocial: string;
	baseImponible: number;
	igv: number;
	total: number;
	moneda: Currency;
	tipoCambio?: number;
	estado?: string;
	hashSunat?: string;
	fechaRecepcion?: Date;
}

export interface SireSyncResult {
	success: boolean;
	ticket?: string;
	records?: SireRecord[];
	totalRecords?: number;
	discrepancies?: SireDiscrepancy[];
	error?: string;
}

export interface SireDiscrepancy {
	tipo: "FALTA_LOCAL" | "FALTA_SUNAT" | "MONTO_DIFERENTE" | "ESTADO_DIFERENTE";
	comprobante: string;
	detalleLocal?: string;
	detalleSunat?: string;
	montoLocal?: number;
	montoSunat?: number;
}
