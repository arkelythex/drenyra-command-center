import type { FiscalActionContext, FiscalEvidenceItem } from "./fiscal-pipeline";
export type ExpedienteKind = "CIERRE_MENSUAL" | "SIRE_COMPRAS" | "SIRE_VENTAS" | "CONCILIACION_BANCARIA" | "AUDITORIA_FISCAL" | "DECLARACION_JURADA" | "DETRACCIONES" | "PERCEPCIONES" | "RETENCIONES" | "GENERAL";
export type ExpedienteStatus = "ABIERTO" | "EN_PROCESO" | "PENDIENTE_REVISION" | "PENDIENTE_APROBACION" | "CERRADO" | "ARCHIVADO";
export declare const EXPEDIENTE_STATUS_LABELS: Record<ExpedienteStatus, string>;
export declare const EXPEDIENTE_KIND_LABELS: Record<ExpedienteKind, string>;
export interface DocumentoFiscal {
    id: string;
    expedienteId: string;
    tipo: "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "CDR" | "XML_UBL" | "SIRE_REPORTE" | "CONCILIACION" | "ASIENTO_CONTABLE" | "DECLARACION" | "OTRO";
    label: string;
    numero: string;
    fechaEmision: string;
    monto?: {
        valor: number;
        moneda: "PEN" | "USD";
    };
    rucEmisor?: string;
    rucReceptor?: string;
    hash: string;
    url?: string;
    verificado: boolean;
}
export interface ExpedienteFiscal {
    id: string;
    companyRuc: string;
    companyName: string;
    periodo: string;
    kind: ExpedienteKind;
    status: ExpedienteStatus;
    titulo: string;
    descripcion: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    acciones: FiscalActionContext[];
    documentos: DocumentoFiscal[];
    evidencia: FiscalEvidenceItem[];
    requiredApprovers: string[];
    approvedBy: string[];
    agentSummary?: string;
    globalRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    pendingActions: number;
    totalDocuments: number;
}
export interface CierreMensualChecklistItem {
    id: string;
    label: string;
    descripcion: string;
    completado: boolean;
    requiereEvidencia: boolean;
    evidencia?: FiscalEvidenceItem[];
    riesgo: "LOW" | "MEDIUM" | "HIGH";
    orden: number;
}
export interface CierreMensual {
    id: string;
    companyRuc: string;
    companyName: string;
    periodo: string;
    status: ExpedienteStatus;
    startedAt: string;
    completedAt?: string;
    checklist: CierreMensualChecklistItem[];
    progress: number;
    agentAnalysis?: {
        agentId: string;
        agentName: string;
        confidence: number;
        summary: string;
        discrepancies: number;
        recommendations: string[];
    };
    expedienteId: string;
    firmas: {
        contador?: {
            firmado: boolean;
            fecha?: string;
        };
        revisor?: {
            firmado: boolean;
            fecha?: string;
        };
        representante?: {
            firmado: boolean;
            fecha?: string;
        };
    };
    sireStatus: "PENDIENTE" | "CONCILIADO" | "CON_DISCREPANCIAS" | "NO_APLICA";
    bancosStatus: "PENDIENTE" | "CONCILIADO" | "CON_DISCREPANCIAS" | "NO_APLICA";
    igvStatus: "PENDIENTE" | "VALIDADO" | "CON_DISCREPANCIAS" | "NO_APLICA";
    globalRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}
export declare function buildDefaultCierreChecklist(expedienteId: string): CierreMensualChecklistItem[];
export declare function calculateCierreProgress(checklist: CierreMensualChecklistItem[]): number;
export declare const EXPEDIENTE_STATUS_COLORS: Record<ExpedienteStatus, string>;
//# sourceMappingURL=expediente-fiscal.d.ts.map