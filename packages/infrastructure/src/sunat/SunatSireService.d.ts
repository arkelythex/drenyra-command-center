import type { SireDownloadResponse, SunatApiClient } from "./SunatApiClient";
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
    moneda: import("@drenyra/domain").Currency;
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
export declare class SunatSireService {
    private client;
    private readonly POLL_INTERVAL_MS;
    private readonly MAX_POLL_ATTEMPTS;
    constructor(client: SunatApiClient);
    requestDownload(request: SireSyncRequest): Promise<SireSyncResult>;
    checkStatus(ruc: string, ticket: string): Promise<SireSyncStatus>;
    waitForDownload(ruc: string, ticket: string, onProgress?: (status: SireSyncStatus) => void): Promise<SireSyncStatus>;
    download(ruc: string, codDescarga: string): Promise<SireDownloadResponse | null>;
    parseRecords(content: Buffer, _tipo: SireRegisterType): SireRecord[];
    findDiscrepancies(localRecords: SireRecord[], sireRecords: SireRecord[]): SireDiscrepancy[];
    fullSync(request: SireSyncRequest, localRecords: SireRecord[], onProgress?: (status: SireSyncStatus) => void): Promise<SireSyncResult>;
    private parseDate;
    private delay;
}
export declare function createSireService(client: SunatApiClient): SunatSireService;
//# sourceMappingURL=SunatSireService.d.ts.map