export interface SunatCredentials {
	clientId: string;
	clientSecret: string;
}

export interface SunatToken {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	expiresAt: Date;
}

export interface SunatApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

export interface RucInfo {
	ruc: string;
	razonSocial: string;
	estado: "ACTIVO" | "BAJA" | "SUSPENDIDO";
	condicion: "HABIDO" | "NO HABIDO";
	direccion?: string;
	ubigeo?: string;
	tipoContribuyente?: string;
}

export interface SireTicketRequest {
	ruc: string;
	periodo: string;
	tipo: "COMPRAS" | "VENTAS";
}

export interface SireTicketResponse {
	numTicket: string;
	estado: "PENDIENTE" | "PROCESANDO" | "PROCESADO" | "ERROR";
	fechaSolicitud: Date;
}

export interface SireDownloadResponse {
	nomArchivo: string;
	codDescarga: string;
	desEstado: string;
	archivo?: Buffer;
}

export const SUNAT_BASE_URL = "https://api.sunat.gob.pe";
export const SUNAT_OAUTH_URL =
	"https://api-seguridad.sunat.gob.pe/v1/clientessol";
export const SUNAT_SIRE_URL = "https://api-sire.sunat.gob.pe/v1";
export const REQUEST_TIMEOUT_MS = 45000;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 2000;
