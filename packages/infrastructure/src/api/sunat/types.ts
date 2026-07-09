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
