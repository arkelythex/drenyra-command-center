import type {
	SireDownloadResponse,
	SireTicketRequest,
	SunatApiClient,
} from "../SunatApiClient";
import type { SireSyncRequest, SireSyncResult, SireSyncStatus } from "./types";

export async function requestDownload(
	client: SunatApiClient,
	request: SireSyncRequest,
): Promise<SireSyncResult> {
	try {
		const ticketRequest: SireTicketRequest = {
			ruc: request.ruc,
			periodo: request.periodo,
			tipo: request.tipo,
		};

		const response = await client.solicitarTicketSire(ticketRequest);

		if (!response.success || !response.data) {
			return {
				success: false,
				error: response.error?.message || "Error al solicitar descarga SIRE",
			};
		}

		return {
			success: true,
			ticket: response.data.numTicket,
		};
	} catch (error) {
		console.error("SunatSireService.requestDownload error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Error de conexión con SUNAT",
		};
	}
}

export async function checkStatus(
	client: SunatApiClient,
	ruc: string,
	ticket: string,
): Promise<SireSyncStatus> {
	try {
		const response = await client.consultarEstadoTicket(ruc, ticket);

		if (!response.success || !response.data) {
			return {
				ticket,
				estado: "ERROR",
				mensaje: response.error?.message || "Error al consultar estado",
			};
		}

		const data = response.data;

		let estado: SireSyncStatus["estado"] = "PENDIENTE";
		if (data.estado === "PROCESADO") {
			estado = "LISTO";
		} else if (data.estado === "PROCESANDO") {
			estado = "PROCESANDO";
		} else if (data.estado === "ERROR") {
			estado = "ERROR";
		}

		return {
			ticket,
			estado,
			archivoDisponible: estado === "LISTO",
		};
	} catch (error) {
		return {
			ticket,
			estado: "ERROR",
			mensaje: error instanceof Error ? error.message : "Error de conexión",
		};
	}
}

export async function download(
	client: SunatApiClient,
	ruc: string,
	codDescarga: string,
): Promise<SireDownloadResponse | null> {
	try {
		const response = await client.descargarArchivoSire(ruc, codDescarga);

		if (!response.success || !response.data) {
			console.error("SIRE download failed:", response.error);
			return null;
		}

		return response.data;
	} catch (error) {
		console.error("SunatSireService.download error:", error);
		return null;
	}
}
