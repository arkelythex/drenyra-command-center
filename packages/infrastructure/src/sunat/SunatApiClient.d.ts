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
import type { RucInfo } from "../types";
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
export declare class SunatApiClient {
    private organizationId;
    private credentials?;
    constructor(organizationId: number);
    initialize(): Promise<boolean>;
    getAccessToken(): Promise<string>;
    private requestNewToken;
    request<T>(endpoint: string, options?: RequestInit): Promise<SunatApiResponse<T>>;
    private fetchWithRetry;
    private delay;
    consultarRuc(ruc: string): Promise<SunatApiResponse<RucInfo>>;
    solicitarTicketSire(request: SireTicketRequest): Promise<SunatApiResponse<SireTicketResponse>>;
    consultarEstadoTicket(ruc: string, numTicket: string): Promise<SunatApiResponse<SireTicketResponse>>;
    descargarArchivoSire(ruc: string, codDescarga: string): Promise<SunatApiResponse<SireDownloadResponse>>;
}
export declare function createSunatClient(organizationId: number): Promise<SunatApiClient | null>;
//# sourceMappingURL=SunatApiClient.d.ts.map