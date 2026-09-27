export type FiscalPhaseId = "captura" | "clasificacion" | "conciliacion" | "cierre" | "declaracion" | "auditoria";
export type PhaseStatus = "not_started" | "in_progress" | "completed" | "blocked" | "failed";
export type GateSeverity = "info" | "warning" | "error" | "critical";
export interface GateResult {
    gateId: string;
    gateName: string;
    passed: boolean;
    severity: GateSeverity;
    reason?: string;
    evidence?: unknown;
    evaluatedAt: Date;
}
export interface PhaseGateContext {
    ruc: string;
    periodo: string;
    currentPhase: FiscalPhaseId;
    targetPhase: FiscalPhaseId;
    phaseState: PhaseState;
    periodState: FiscalPeriodState;
}
export interface GateDefinition {
    id: string;
    name: string;
    description: string;
    phaseId: FiscalPhaseId;
    position: "entry" | "exit";
    evaluate: (state: FiscalPeriodState, context: PhaseGateContext) => Promise<GateResult>;
}
export interface GateCondition {
    type: "auto_pass" | "auto_fail" | "requires_approval";
    threshold?: number;
    expression?: string;
}
export interface PhaseHistoryEntry {
    phaseId: FiscalPhaseId;
    status: PhaseStatus;
    startedAt: Date;
    completedAt?: Date;
    gateResults: GateResult[];
    agentOutput?: unknown;
    error?: string;
}
export interface FiscalPeriodState {
    ruc: string;
    periodo: string;
    currentPhase: FiscalPhaseId;
    status: PhaseStatus;
    phaseHistory: PhaseHistoryEntry[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface PhaseState {
    phaseId: FiscalPhaseId;
    status: PhaseStatus;
    startedAt?: Date;
    completedAt?: Date;
    gateResults: GateResult[];
    agentOutput?: unknown;
    error?: string;
}
export interface PhaseAgentOutput {
    phaseId: FiscalPhaseId;
    ruc: string;
    periodo: string;
    success: boolean;
    summary: string;
    data: unknown;
}
export interface CapturaReport extends PhaseAgentOutput {
    phaseId: "captura";
    data: {
        totalRecibidos: number;
        totalPendientes: number;
        totalErrores: number;
        comprobantes: Array<{
            id: string;
            tipo: string;
            estado: string;
        }>;
    };
}
export interface ClasificacionReport extends PhaseAgentOutput {
    phaseId: "clasificacion";
    data: {
        totalProcesados: number;
        totalClasificados: number;
        totalAmbiguos: number;
        cobertura: number;
        clasificaciones: Array<{
            comprobanteId: string;
            cuentaPCGE: string;
            confianza: number;
            igvCalculado: number;
        }>;
    };
}
export interface ConciliacionReport extends PhaseAgentOutput {
    phaseId: "conciliacion";
    data: {
        totalTransacciones: number;
        paresConciliados: number;
        discrepancias: number;
        saldoLibro: number;
        saldoBanco: number;
        diferencia: number;
        variance: number;
        detalleDiscrepancias: Array<{
            id: string;
            monto: number;
            tipo: string;
            descripcion: string;
        }>;
    };
}
export interface CierreReport extends PhaseAgentOutput {
    phaseId: "cierre";
    data: {
        totalCuentas: number;
        saldosFinales: Array<{
            cuentaPCGE: string;
            nombre: string;
            debe: number;
            haber: number;
            saldo: number;
        }>;
        ajustes: number;
        pendientes: number;
        fechaCierre: string;
    };
}
export interface DeclaracionReport extends PhaseAgentOutput {
    phaseId: "declaracion";
    data: {
        presentada: boolean;
        numeroComprobante: string;
        cdrId?: string;
        codigoSUNAT?: string;
        observaciones: string[];
        fechaPresentacion: string;
        tipoDeclaracion: "SIRE" | "PDT" | "PLAME" | "DET";
    };
}
export interface AuditoriaReport extends PhaseAgentOutput {
    phaseId: "auditoria";
    data: {
        confianza: number;
        hallazgos: Array<{
            id: string;
            tipo: "error" | "warning" | "info";
            descripcion: string;
            fase: FiscalPhaseId;
            recomendacion: string;
        }>;
        memo: string;
        recomendaciones: string[];
        periodoCerrado: boolean;
    };
}
export interface AutoAdvanceConfig {
    minConfidence: number;
    blockOnWarnings: boolean;
    phaseOverrides?: Partial<Record<FiscalPhaseId, {
        enabled: boolean;
        minConfidence?: number;
        blockOnWarnings?: boolean;
    }>>;
}
export interface AutoAdvanceContext {
    ruc: string;
    periodo: string;
    phaseId: FiscalPhaseId;
    gateResults: GateResult[];
    agentOutput?: unknown;
    metadata: Record<string, unknown>;
}
export interface AutoAdvanceDecision {
    shouldAdvance: boolean;
    confidence: number;
    reason: string;
    blockingGates: string[];
}
export type PhaseAutoAdvanceEvaluator = (context: AutoAdvanceContext) => AutoAdvanceDecision;
export interface BatchConfig {
    maxParallel: number;
    autoAdvance: boolean;
    autoAdvanceConfig?: AutoAdvanceConfig;
}
export interface BatchEntry {
    ruc: string;
    periodo: string;
    autoAdvance?: boolean;
    metadata?: Record<string, unknown>;
}
export interface BatchEntryStatus {
    ruc: string;
    periodo: string;
    status: PhaseStatus;
    currentPhase: FiscalPhaseId;
    startedAt: Date;
    completedAt?: Date;
    phasesCompleted: number;
    lastError?: string;
}
export interface BatchStatus {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    failed: number;
    notStarted: number;
    entries: BatchEntryStatus[];
    startedAt: Date;
    updatedAt: Date;
}
export interface BatchCallbacks {
    onPhaseComplete?: (ruc: string, periodo: string, phaseId: FiscalPhaseId, state: FiscalPeriodState) => Promise<void>;
    onPeriodComplete?: (ruc: string, periodo: string, state: FiscalPeriodState) => Promise<void>;
    onPhaseBlocked?: (ruc: string, periodo: string, phaseId: FiscalPhaseId, blockers: GateResult[]) => Promise<void>;
    onError?: (ruc: string, periodo: string, phaseId: FiscalPhaseId, error: string) => Promise<void>;
}
export interface FiscalPhaseGraph {
    phases: FiscalPhaseNode[];
    transitions: PhaseTransition[];
}
export interface FiscalPhaseNode {
    id: FiscalPhaseId;
    label: string;
    description: string;
    entryGates: string[];
    exitGates: string[];
}
export interface PhaseTransition {
    from: FiscalPhaseId;
    to: FiscalPhaseId;
    condition: GateCondition;
    autoTransition: boolean;
}
//# sourceMappingURL=types.d.ts.map