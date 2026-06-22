/**
 * SunatDashboard — shared types for SUNAT Compliance Command Center
 */

export type RucStatus = "ACTIVO" | "SUSPENDIDO";
export type SireValidationStatus = "VALIDADO" | "PENDIENTE" | "OBSERVADO";
export type CalendarType = "PLAME" | "IGV" | "RENTA" | "DETRACCIONES" | "SIRE";
export type NotificationType = "RESOLUCION" | "CAMBIO" | "RECORDATORIO";

export interface RucInfo {
	ruc: string;
	razonSocial: string;
	estado: RucStatus;
	ultimaVerificacion: Date;
}

export interface SirePeriod {
	periodo: string;
	estado: SireValidationStatus;
	vencimiento: Date;
}

export interface TaxDeadline {
	obligacion: string;
	descripcion: string;
	fechaVencimiento: Date;
	tipo: CalendarType;
}

export interface Notification {
	id: string;
	titulo: string;
	fecha: Date;
	tipo: NotificationType;
	leida: boolean;
}
