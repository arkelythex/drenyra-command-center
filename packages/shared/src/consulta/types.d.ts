export interface ConsultaResponse {
    tipo: string;
    ruc: string;
    periodo: string;
    resultado: Record<string, unknown>;
    confianza: number;
    fuentes: ConsultaFuente[];
    evidenceArtifacts: EvidenceRef[];
    error?: string;
    sugerencia?: string;
}
export interface ConsultaFuente {
    tipo: string;
    serie: string;
    numero: number;
    monto: number;
    moneda: string;
    cdrHash?: string;
    fecha: string;
}
export interface EvidenceRef {
    id: string;
    kind: "PHASE_INPUT" | "PHASE_OUTPUT" | "GATE_RESULT";
    phase: string;
    hash: string;
}
export interface AccountantSummary {
    ruc: string;
    periodo: string;
    igvCompra: number;
    igvVenta: number;
    detraccionesPendientes: number;
    detraccionesMonto: number;
    pendingApprovals: number;
    facturasCompra: number;
    facturasVenta: number;
}
//# sourceMappingURL=types.d.ts.map