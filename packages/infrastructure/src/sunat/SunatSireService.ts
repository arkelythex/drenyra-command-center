/**
 * SUNAT SIRE Service
 *
 * Service for synchronizing with SUNAT's SIRE (Sistema Integrado de Registros Electrónicos).
 *
 * Functionality:
 * - Request purchase/sales register downloads
 * - Poll for download status
 * - Parse downloaded data
 * - Reconcile with local transactions
 *
 * ⚠️ WARNING: SUNAT does NOT have a test environment.
 * All operations affect PRODUCTION data.
 */

import {
	type SireDownloadResponse,
	type SireTicketRequest,
	type SunatApiClient,
} from "./SunatApiClient";

// ============================================
// TYPES
// ============================================

/**
 * SireRegisterType type.
 *
 * @example
 * ```ts
 * const value: SireRegisterType = {} as SireRegisterType;
 * console.log(value);
 * ```
 */
export type SireRegisterType = "COMPRAS" | "VENTAS";

/**
 * SireSyncRequest interface.
 *
 * @example
 * ```ts
 * const value: SireSyncRequest = {} as SireSyncRequest;
 * console.log(value);
 * ```
 */
export interface SireSyncRequest {
	organizationId: number;
	ruc: string;
	periodo: string; // Format: YYYYMM
	tipo: SireRegisterType;
}

/**
 * SireSyncStatus interface.
 *
 * @example
 * ```ts
 * const value: SireSyncStatus = {} as SireSyncStatus;
 * console.log(value);
 * ```
 */
export interface SireSyncStatus {
	ticket: string;
	estado: "PENDIENTE" | "PROCESANDO" | "LISTO" | "ERROR";
	mensaje?: string;
	progreso?: number; // 0-100
	registros?: number;
	archivoDisponible?: boolean;
}

/**
 * SireRecord interface.
 *
 * @example
 * ```ts
 * const value: SireRecord = {} as SireRecord;
 * console.log(value);
 * ```
 */
export interface SireRecord {
	// Common fields
	periodo: string;
	correlativo: string;
	fechaEmision: Date;
	tipoComprobante: string;
	serie: string;
	numero: string;
	tipoDocIdentidad: string;
	numeroDocIdentidad: string;
	razonSocial: string;
	/** Monetary amount in cents (integer). Divide by 100 for soles display. */
	baseImponible: number;
	/** Monetary amount in cents (integer). Divide by 100 for soles display. */
	igv: number;
	/** Monetary amount in cents (integer). Divide by 100 for soles display. */
	total: number;
		moneda: import("@drenyra/domain").Currency;
		/** Exchange rate (decimal, NOT in cents). E.g. 3.75 = S/ 3.75 per USD. */
		tipoCambio?: number;

	// Purchase-specific
	estado?: string;

	// Metadata
	hashSunat?: string;
	fechaRecepcion?: Date;
}

/**
 * SireSyncResult interface.
 *
 * @example
 * ```ts
 * const value: SireSyncResult = {} as SireSyncResult;
 * console.log(value);
 * ```
 */
export interface SireSyncResult {
	success: boolean;
	ticket?: string;
	records?: SireRecord[];
	totalRecords?: number;
	discrepancies?: SireDiscrepancy[];
	error?: string;
}

/**
 * SireDiscrepancy interface.
 *
 * @example
 * ```ts
 * const value: SireDiscrepancy = {} as SireDiscrepancy;
 * console.log(value);
 * ```
 */
export interface SireDiscrepancy {
	tipo: "FALTA_LOCAL" | "FALTA_SUNAT" | "MONTO_DIFERENTE" | "ESTADO_DIFERENTE";
	comprobante: string;
	detalleLocal?: string;
	detalleSunat?: string;
	montoLocal?: number;
	montoSunat?: number;
}

// ============================================
// SIRE SERVICE CLASS
// ============================================

/**
 * SunatSireService class.
 *
 * @example
 * ```ts
 * const value = new SunatSireService();
 * console.log(value);
 * ```
 */
export class SunatSireService {
	private client: SunatApiClient;
	private readonly POLL_INTERVAL_MS = 5000; // 5 seconds
	private readonly MAX_POLL_ATTEMPTS = 60; // 5 minutes max

	constructor(client: SunatApiClient) {
		this.client = client;
	}

	/**
	 * Request a SIRE download
	 * Returns a ticket number to check status
	 */
	async requestDownload(request: SireSyncRequest): Promise<SireSyncResult> {
		try {
			const ticketRequest: SireTicketRequest = {
				ruc: request.ruc,
				periodo: request.periodo,
				tipo: request.tipo,
			};

			const response = await this.client.solicitarTicketSire(ticketRequest);

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
					error instanceof Error
						? error.message
						: "Error de conexión con SUNAT",
			};
		}
	}

	/**
	 * Check the status of a SIRE download request
	 */
	async checkStatus(ruc: string, ticket: string): Promise<SireSyncStatus> {
		try {
			const response = await this.client.consultarEstadoTicket(ruc, ticket);

			if (!response.success || !response.data) {
				return {
					ticket,
					estado: "ERROR",
					mensaje: response.error?.message || "Error al consultar estado",
				};
			}

			const data = response.data;

			// Map SUNAT status to our status
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

	/**
	 * Wait for a SIRE download to complete
	 * Polls the status until ready or timeout
	 */
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

	/**
	 * Download the SIRE file once ready
	 */
	async download(
		ruc: string,
		codDescarga: string,
	): Promise<SireDownloadResponse | null> {
		try {
			const response = await this.client.descargarArchivoSire(ruc, codDescarga);

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

	/**
	 * Parse SIRE file content (simplified - actual implementation would parse ZIP)
	 * In production, this would unzip and parse the TXT/CSV files
	 */
	parseRecords(content: Buffer, _tipo: SireRegisterType): SireRecord[] {
		// NOTE: This is a placeholder implementation
		// Real implementation would:
		// 1. Unzip the buffer
		// 2. Find the TXT/CSV file
		// 3. Parse each line according to SUNAT format

		const records: SireRecord[] = [];

		try {
			// For demonstration, assume content is a text buffer
			const text = content.toString("utf-8");
			const lines = text.split("\n").filter((line) => line.trim());

			for (const line of lines) {
				const fields = line.split("|");

				if (fields.length < 15) continue;

				const record: SireRecord = {
					periodo: fields[0] || "",
					correlativo: fields[1] || "",
					fechaEmision: this.parseDate(fields[2] || ""),
					tipoComprobante: fields[3] || "",
					serie: fields[4] || "",
					numero: fields[5] || "",
					tipoDocIdentidad: fields[6] || "",
					numeroDocIdentidad: fields[7] || "",
					razonSocial: fields[8] || "",
					// SUNAT SIRE amounts come as soles; convert to cents per project Money model convention
					baseImponible: Math.round(parseFloat(fields[9] || "0") * 100),
					igv: Math.round(parseFloat(fields[10] || "0") * 100),
					total: Math.round(parseFloat(fields[11] || "0") * 100),
					moneda: (fields[12] || "PEN") as import("@drenyra/domain").Currency,
					tipoCambio: fields[13] ? parseFloat(fields[13]) : undefined,
					estado: fields[14],
				};

				records.push(record);
			}
		} catch (error) {
			console.error("Error parsing SIRE records:", error);
		}

		return records;
	}

	/**
	 * Compare local records with SIRE records
	 * Returns discrepancies found
	 */
	findDiscrepancies(
		localRecords: SireRecord[],
		sireRecords: SireRecord[],
	): SireDiscrepancy[] {
		const discrepancies: SireDiscrepancy[] = [];

		// Create maps for quick lookup
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

		// Check for records in SIRE but not in local
		for (const [key, sireRecord] of sireMap) {
			if (!localMap.has(key)) {
				discrepancies.push({
					tipo: "FALTA_LOCAL",
					comprobante: key,
					// total is in cents → divide by 100 for soles display
					detalleSunat: `${sireRecord.razonSocial} - S/ ${(sireRecord.total / 100).toFixed(2)}`,
				});
			}
		}

		// Check for records in local but not in SIRE
		for (const [key, localRecord] of localMap) {
			if (!sireMap.has(key)) {
				discrepancies.push({
					tipo: "FALTA_SUNAT",
					comprobante: key,
					// total is in cents → divide by 100 for soles display
					detalleLocal: `${localRecord.razonSocial} - S/ ${(localRecord.total / 100).toFixed(2)}`,
				});
			}
		}

		// Check for amount differences
		for (const [key, localRecord] of localMap) {
			const sireRecord = sireMap.get(key);
			if (sireRecord) {
				// Both totals are in cents — compare as integers, tolerance of 1 cent
				const diff = Math.abs(localRecord.total - sireRecord.total);
				if (diff > 1) {
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

	/**
	 * Full sync workflow: request, wait, download, parse, compare
	 */
	async fullSync(
		request: SireSyncRequest,
		localRecords: SireRecord[],
		onProgress?: (status: SireSyncStatus) => void,
	): Promise<SireSyncResult> {
		// Step 1: Request download
		const downloadRequest = await this.requestDownload(request);
		if (!downloadRequest.success || !downloadRequest.ticket) {
			return downloadRequest;
		}

		onProgress?.({
			ticket: downloadRequest.ticket,
			estado: "PENDIENTE",
			progreso: 10,
		});

		// Step 2: Wait for processing
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

		// Step 3: Download file
		const file = await this.download(request.ruc, downloadRequest.ticket);
		if (!file || !file.archivo) {
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

		// Step 4: Parse records
		const sireRecords = this.parseRecords(file.archivo, request.tipo);

		// Step 5: Find discrepancies
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

	/**
	 * Parse date from DD/MM/YYYY format
	 */
	private parseDate(dateStr: string): Date {
		if (!dateStr) return new Date();

		const parts = dateStr.split("/");
		if (parts.length !== 3) return new Date();

		const day = parseInt(parts[0] || "1", 10);
		const month = parseInt(parts[1] || "1", 10) - 1;
		const year = parseInt(parts[2] || "2025", 10);

		return new Date(year, month, day);
	}

	/**
	 * Delay helper
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * createSireService operation.
 *
 * @param client - Input for client.
 * @returns Result of createSireService.
 * @example
 * ```ts
 * const result = createSireService({} as SunatApiClient);
 * console.log(result);
 * ```
 */
export function createSireService(client: SunatApiClient): SunatSireService {
	return new SunatSireService(client);
}
