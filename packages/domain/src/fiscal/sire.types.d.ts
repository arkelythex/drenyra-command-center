export interface SIRESalesRecord {
    periodo: string;
    correlativo: string;
    fechaEmision: string;
    tipoComprobante: string;
    serie: string;
    numero: string;
    numeroFinal: string;
    tipoDocumentoCliente: string;
    numeroDocumentoCliente: string;
    razonSocialCliente: string;
    valorExportacion: number;
    baseImponibleOGravada: number;
    descuentoBaseImponible: number;
    igv: number;
    descuentoIGV: number;
    importeExonerado: number;
    importeInafecto: number;
    isc: number;
    baseImponibleIVAP: number;
    ivap: number;
    icbper: number;
    otrosTributos: number;
    totalComprobante: number;
    tipoMoneda: string;
    tipoCambio: number;
    fechaEmisionModificado: string;
    tipoComprobanteModificado: string;
    serieModificado: string;
    numeroModificado: string;
    estado: string;
}
export interface SIREPurchasesRecord {
    periodo: string;
    correlativo: string;
    fechaEmision: string;
    fechaVencimiento: string;
    tipoComprobante: string;
    serie: string;
    anoDUA: string;
    numeroComprobante: string;
    numeroFinal: string;
    tipoDocumentoProveedor: string;
    numeroDocumentoProveedor: string;
    razonSocialProveedor: string;
    baseImponible: number;
    igv: number;
    baseImponibleNoGravada: number;
    igvNoGravado: number;
    baseImponibleNoGravadaNG: number;
    igvNoGravadoNG: number;
    valorAdquisicionesNG: number;
    isc: number;
    icbper: number;
    otrosTributos: number;
    totalComprobante: number;
    tipoMoneda: string;
    tipoCambio: number;
    fechaEmisionModificado: string;
    tipoComprobanteModificado: string;
    serieModificado: string;
    numeroDUAModificado: string;
    numeroModificado: string;
    fechaDetraccion: string;
    numeroDetraccion: string;
    retencion: string;
    estado: string;
    clasificacionBienes: string;
}
export interface SIREExportOptions {
    year: number;
    month: number;
    companyId: string;
    format: "TXT" | "EXCEL";
    includeHeader?: boolean;
}
export interface SIREValidationResult {
    isValid: boolean;
    errors: Array<{
        line: number;
        field: string;
        message: string;
    }>;
    warnings: Array<{
        line: number;
        field: string;
        message: string;
    }>;
    recordCount: number;
}
export interface SIRESummary {
    period: string;
    recordCount: number;
    totalAmount: number;
    totalIGV: number;
    currency: string;
    generatedAt: Date;
}
export interface SIRESunatLiveLedgerSummary {
    ledgerType: "ventas" | "compras";
    recordCount: number;
    totalAmount: number;
    totalIGV: number;
}
export type SIRESunatLiveUnavailableReason = "missing_config" | "api_mode_disabled" | "auth_unavailable" | "timeout" | "upstream_error" | "invalid_payload" | "internal_error";
interface SIRESunatLiveSummaryBase {
    source: "sunat-api";
    period: string;
    checkedAt: string;
}
export interface SIRESunatLiveSummaryAvailable extends SIRESunatLiveSummaryBase {
    status: "available";
    message: string;
    ledgers: SIRESunatLiveLedgerSummary[];
}
export interface SIRESunatLiveSummaryUnavailable extends SIRESunatLiveSummaryBase {
    status: "unavailable";
    reason: SIRESunatLiveUnavailableReason;
    message: string;
    ledgers: [];
}
export type SIRESunatLiveSummary = SIRESunatLiveSummaryAvailable | SIRESunatLiveSummaryUnavailable;
export {};
//# sourceMappingURL=sire.types.d.ts.map