export interface RucInfo {
	ruc: string;
	razonSocial: string;
	nombreComercial?: string;
	estado: "ACTIVO" | "BAJA" | "SUSPENSION" | string;
	condicion: "HABIDO" | "NO HABIDO" | "NO HALLADO" | string;
	direccion?: string;
	ubigeo?: string;
	tipo: "PERSONA NATURAL" | "PERSONA JURIDICA" | string;
	fechaInscripcion?: string;
	fechaInicioActividades?: string;
	actividadEconomica?: string;
}

export interface InvoiceVerification {
	esValido: boolean;
	rucEmisor: string;
	tipoComprobante: string;
	serie: string;
	numero: string;
	fechaEmision?: string;
	estado: "ACEPTADO" | "RECHAZADO" | "PENDIENTE" | string;
	mensaje: string;
	montoTotal?: number;
}

export interface DniInfo {
	dni: string;
	nombres: string;
	apellidoPaterno: string;
	apellidoMaterno: string;
	nombreCompleto: string;
}
