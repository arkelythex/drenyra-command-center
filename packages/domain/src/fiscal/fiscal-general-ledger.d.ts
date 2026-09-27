export type IgvTreatment = "GRAVADO" | "EXONERADO" | "INAFECTO" | "EXPORTACION" | "MIXTO";
export declare const IGV_TREATMENT_LABELS: Record<IgvTreatment, string>;
export type IgvType = "DEBITO_FISCAL" | "CREDITO_FISCAL";
export interface DetraccionInfo {
    codigo: string;
    porcentaje: number;
    monto: number;
    moneda: "PEN" | "USD";
    aplica: boolean;
    estado: "PENDIENTE" | "PAGADO" | "EXONERADO";
    fechaLimite?: string;
}
export interface PercepcionInfo {
    porcentaje: number;
    monto: number;
    agente: string;
    aplica: boolean;
}
export interface RetencionInfo {
    porcentaje: number;
    monto: number;
    agente: string;
    aplica: boolean;
}
export type SireCategory = "COMPRAS" | "VENTAS";
export type SireDocumentType = "01" | "03" | "07" | "08" | "20" | "50" | string;
export interface FiscalClassification {
    igvTreatment: IgvTreatment;
    igvType: IgvType;
    igvRate: number;
    baseImponible: number;
    igvAmount: number;
    total: number;
    moneda: "PEN" | "USD";
    sireCategory: SireCategory;
    sireDocumentType: SireDocumentType;
    periodo: string;
    detraccion: DetraccionInfo;
    percepcion: PercepcionInfo;
    retencion: RetencionInfo;
    confidence: number;
    classificationSource: "DETERMINISTIC" | "AI" | "HUMAN";
}
export interface FiscalTransaction {
    id: string;
    companyRuc: string;
    companyId: string;
    fechaEmision: string;
    fechaContable: string;
    tipoComprobante: SireDocumentType;
    serie: string;
    numero: string;
    rucContraparte: string;
    razonSocialContraparte: string;
    moneda: "PEN" | "USD";
    tipoCambio?: number;
    montoOriginal: number;
    montoPEN: number;
    classification: FiscalClassification;
    categoriaContable?: string;
    metadata: Record<string, unknown>;
    hash: string;
    createdAt: string;
    classifiedBy: string;
}
export interface FiscalPeriodSummary {
    periodo: string;
    companyRuc: string;
    ventasGravadas: number;
    ventasExoneradas: number;
    ventasInafectas: number;
    igvVentas: number;
    comprasGravadas: number;
    igvCompras: number;
    igvAPagar: number;
    igvAFavor: number;
    totalDetracciones: number;
    detraccionesPendientes: number;
    totalPercepciones: number;
    totalRetenciones: number;
    transactionCount: number;
    pendingReview: number;
    generatedAt: string;
}
export interface FiscalHealthScore {
    companyRuc: string;
    periodo: string;
    overall: number;
    components: {
        sireReproducibility: number;
        anomaliesScore: number;
        timeliness: number;
        compliance: number;
    };
    alerts: Array<{
        severity: "CRITICAL" | "WARNING" | "INFO";
        message: string;
        affectedArea: string;
    }>;
    generatedAt: string;
}
//# sourceMappingURL=fiscal-general-ledger.d.ts.map