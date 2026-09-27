export class SunatSireService {
    client;
    POLL_INTERVAL_MS = 5000;
    MAX_POLL_ATTEMPTS = 60;
    constructor(client) {
        this.client = client;
    }
    async requestDownload(request) {
        try {
            const ticketRequest = {
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
        }
        catch (error) {
            console.error("SunatSireService.requestDownload error:", error);
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Error de conexión con SUNAT",
            };
        }
    }
    async checkStatus(ruc, ticket) {
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
            let estado = "PENDIENTE";
            if (data.estado === "PROCESADO") {
                estado = "LISTO";
            }
            else if (data.estado === "PROCESANDO") {
                estado = "PROCESANDO";
            }
            else if (data.estado === "ERROR") {
                estado = "ERROR";
            }
            return {
                ticket,
                estado,
                archivoDisponible: estado === "LISTO",
            };
        }
        catch (error) {
            return {
                ticket,
                estado: "ERROR",
                mensaje: error instanceof Error ? error.message : "Error de conexión",
            };
        }
    }
    async waitForDownload(ruc, ticket, onProgress) {
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
    async download(ruc, codDescarga) {
        try {
            const response = await this.client.descargarArchivoSire(ruc, codDescarga);
            if (!response.success || !response.data) {
                console.error("SIRE download failed:", response.error);
                return null;
            }
            return response.data;
        }
        catch (error) {
            console.error("SunatSireService.download error:", error);
            return null;
        }
    }
    parseRecords(content, _tipo) {
        const records = [];
        try {
            const text = content.toString("utf-8");
            const lines = text.split("\n").filter((line) => line.trim());
            for (const line of lines) {
                const fields = line.split("|");
                if (fields.length < 15)
                    continue;
                const record = {
                    periodo: fields[0] || "",
                    correlativo: fields[1] || "",
                    fechaEmision: this.parseDate(fields[2] || ""),
                    tipoComprobante: fields[3] || "",
                    serie: fields[4] || "",
                    numero: fields[5] || "",
                    tipoDocIdentidad: fields[6] || "",
                    numeroDocIdentidad: fields[7] || "",
                    razonSocial: fields[8] || "",
                    baseImponible: Math.round(parseFloat(fields[9] || "0") * 100),
                    igv: Math.round(parseFloat(fields[10] || "0") * 100),
                    total: Math.round(parseFloat(fields[11] || "0") * 100),
                    moneda: (fields[12] || "PEN"),
                    tipoCambio: fields[13] ? parseFloat(fields[13]) : undefined,
                    estado: fields[14],
                };
                records.push(record);
            }
        }
        catch (error) {
            console.error("Error parsing SIRE records:", error);
        }
        return records;
    }
    findDiscrepancies(localRecords, sireRecords) {
        const discrepancies = [];
        const localMap = new Map();
        const sireMap = new Map();
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
                    detalleSunat: `${sireRecord.razonSocial} - S/ ${(sireRecord.total / 100).toFixed(2)}`,
                });
            }
        }
        for (const [key, localRecord] of localMap) {
            if (!sireMap.has(key)) {
                discrepancies.push({
                    tipo: "FALTA_SUNAT",
                    comprobante: key,
                    detalleLocal: `${localRecord.razonSocial} - S/ ${(localRecord.total / 100).toFixed(2)}`,
                });
            }
        }
        for (const [key, localRecord] of localMap) {
            const sireRecord = sireMap.get(key);
            if (sireRecord) {
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
    async fullSync(request, localRecords, onProgress) {
        const downloadRequest = await this.requestDownload(request);
        if (!downloadRequest.success || !downloadRequest.ticket) {
            return downloadRequest;
        }
        onProgress?.({
            ticket: downloadRequest.ticket,
            estado: "PENDIENTE",
            progreso: 10,
        });
        const status = await this.waitForDownload(request.ruc, downloadRequest.ticket, onProgress);
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
    parseDate(dateStr) {
        if (!dateStr)
            return new Date();
        const parts = dateStr.split("/");
        if (parts.length !== 3)
            return new Date();
        const day = parseInt(parts[0] || "1", 10);
        const month = parseInt(parts[1] || "1", 10) - 1;
        const year = parseInt(parts[2] || "2025", 10);
        return new Date(year, month, day);
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
export function createSireService(client) {
    return new SunatSireService(client);
}
//# sourceMappingURL=SunatSireService.js.map