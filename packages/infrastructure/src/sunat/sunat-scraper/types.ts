export interface BuzonNotification {
	id: string;
	tipo: "NOTIFICACION" | "COBRANZA" | "FISCALIZACION" | "COMUNICADO" | "OTRO";
	asunto: string;
	fechaRecepcion: string;
	esUrgente: boolean;
	leido: boolean;
}

export interface RucStatus {
	ruc: string;
	razonSocial: string;
	estado:
		| "ACTIVO"
		| "BAJA_DE_OFICIO"
		| "BAJA_PROVISIONAL"
		| "SUSPENSION_TEMPORAL";
	condicion: "HABIDO" | "NO_HABIDO" | "NO_HALLADO" | "PENDIENTE";
	fechaInscripcion: string;
	direccion?: string;
	actividadEconomica?: string;
}

export interface ScraperResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	timing?: {
		startedAt: string;
		completedAt: string;
		durationMs: number;
	};
}
