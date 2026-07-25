import type { SireDownloadResponse, SunatApiClient } from "../SunatApiClient";
import {
	checkStatus as checkStatusClient,
	download as downloadClient,
	requestDownload as requestDownloadClient,
} from "./client";
import { parseRecords as parseSireRecords } from "./parser";
import type {
	SireDiscrepancy,
	SireRecord,
	SireRegisterType,
	SireSyncRequest,
	SireSyncResult,
	SireSyncStatus,
} from "./types";

export class SunatSireService {
	private client: SunatApiClient;
	private readonly POLL_INTERVAL_MS = 5000;
	private readonly MAX_POLL_ATTEMPTS = 60;

	constructor(client: SunatApiClient) {
		this.client = client;
	}

	async requestDownload(request: SireSyncRequest): Promise<SireSyncResult> {
		return requestDownloadClient(this.client, request);
	}

	async checkStatus(ruc: string, ticket: string): Promise<SireSyncStatus> {
		return checkStatusClient(this.client, ruc, ticket);
	}

	async waitForDownload(
		ruc: string,
		ticket: string,
		onProgress?: (status: SireSyncStatus) => void,
	): Promise<SireSyncStatus> {
		let attempts = 0;

		while (attempts < this.MAX_POLL_ATTEMPTS) {
			const status = await this.checkStatus(ruc, ticket);

			if (onProgress) {
				onProgress({
					...status,
					progreso: Math.min(95, (attempts / this.MAX_POLL_ATTEMPTS) * 100),
				});
			}

			if (status.estado === "LISTO" || status.estado === "ERROR") {
				return status;
			}

			await this.delay(this.POLL_INTERVAL_MS);
			attempts++;
		}

		return {
			ticket,
			estado: "ERROR",
			mensaje: "Tiempo de espera excedido",
		};
	}

	async download(
		ruc: string,
		codDescarga: string,
	): Promise<SireDownloadResponse | null> {
		return downloadClient(this.client, ruc, codDescarga);
	}

	parseRecords(content: Buffer, tipo: SireRegisterType): SireRecord[] {
		return parseSireRecords(content, tipo);
	}

	findDiscrepancies(
		localRecords: SireRecord[],
		sireRecords: SireRecord[],
	): SireDiscrepancy[] {
		const discrepancies: SireDiscrepancy[] = [];

		const localMap = new Map<string, SireRecord>();
		const sireMap = new Map<string, SireRecord>();

		for (const record of localRecords) {
			const key = `${record.serie}-${record.numero}`;
			localMap.set(key, record);
		}

		for (const record of sireRecords) {
			const key = `${record.serie}-${record.numero}`;
			sireMap.set(key, record);
		}

		for (const [key, sireRecord] of sireMap) {
			if (!localMap.has(key)) {
				discrepancies.push({
					tipo: "FALTA_LOCAL",
					comprobante: key,
					detalleSunat: `${sireRecord.razonSocial} - S/ ${sireRecord.total}`,
				});
			}
		}

		for (const [key, localRecord] of localMap) {
			if (!sireMap.has(key)) {
				discrepancies.push({
					tipo: "FALTA_SUNAT",
					comprobante: key,
					detalleLocal: `${localRecord.razonSocial} - S/ ${localRecord.total}`,
				});
			}
		}

		for (const [key, localRecord] of localMap) {
			const sireRecord = sireMap.get(key);
			if (sireRecord) {
				const diff = Math.abs(localRecord.total - sireRecord.total);
				if (diff > 0.01) {
					discrepancies.push({
						tipo: "MONTO_DIFERENTE",
						comprobante: key,
						montoLocal: localRecord.total,
						montoSunat: sireRecord.total,
					});
				}
			}
		}

		return discrepancies;
	}

	async fullSync(
		request: SireSyncRequest,
		localRecords: SireRecord[],
		onProgress?: (status: SireSyncStatus) => void,
	): Promise<SireSyncResult> {
		const downloadRequest = await this.requestDownload(request);
		if (!downloadRequest.success || !downloadRequest.ticket) {
			return downloadRequest;
		}

		onProgress?.({
			ticket: downloadRequest.ticket,
			estado: "PENDIENTE",
			progreso: 10,
		});

		const status = await this.waitForDownload(
			request.ruc,
			downloadRequest.ticket,
			onProgress,
		);

		if (status.estado !== "LISTO") {
			return {
				success: false,
				ticket: downloadRequest.ticket,
				error: status.mensaje || "La descarga no se completó",
			};
		}

		onProgress?.({
			ticket: downloadRequest.ticket,
			estado: "PROCESANDO",
			progreso: 80,
			mensaje: "Descargando archivo...",
		});

		const file = await this.download(request.ruc, downloadRequest.ticket);
		if (!file?.archivo) {
			return {
				success: false,
				ticket: downloadRequest.ticket,
				error: "Error al descargar archivo SIRE",
			};
		}

		onProgress?.({
			ticket: downloadRequest.ticket,
			estado: "PROCESANDO",
			progreso: 90,
			mensaje: "Procesando registros...",
		});

		const sireRecords = this.parseRecords(file.archivo, request.tipo);
		const discrepancies = this.findDiscrepancies(localRecords, sireRecords);

		onProgress?.({
			ticket: downloadRequest.ticket,
			estado: "LISTO",
			progreso: 100,
			registros: sireRecords.length,
		});

		return {
			success: true,
			ticket: downloadRequest.ticket,
			records: sireRecords,
			totalRecords: sireRecords.length,
			discrepancies,
		};
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export function createSireService(client: SunatApiClient): SunatSireService {
	return new SunatSireService(client);
}
