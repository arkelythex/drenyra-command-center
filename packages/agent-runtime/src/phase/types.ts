// ─── Drenyra Phase Layer — Core Types ──────────────────────────────
// Types for the Fiscal Phase Workflow (period-level orchestration).
// Independent of the transaction layer (transaction/).

/** The 6 fiscal phases of a monthly period cycle. */
export type FiscalPhaseId =
	| "captura"
	| "clasificacion"
	| "conciliacion"
	| "cierre"
	| "declaracion"
	| "auditoria";

/** Status of an individual phase within a period. */
export type PhaseStatus =
	| "not_started"
	| "in_progress"
	| "completed"
	| "blocked"
	| "failed";

/** Severity level for gate evaluation results. */
export type GateSeverity = "info" | "warning" | "error" | "critical";

/** Result of evaluating a single gate during a phase transition. */
export interface GateResult {
	gateId: string;
	gateName: string;
	passed: boolean;
	severity: GateSeverity;
	reason?: string;
	evidence?: unknown;
	evaluatedAt: Date;
}

/** Context provided to gate evaluator functions. */
export interface PhaseGateContext {
	ruc: string;
	periodo: string;
	currentPhase: FiscalPhaseId;
	targetPhase: FiscalPhaseId;
	phaseState: PhaseState;
	periodState: FiscalPeriodState;
}

/** Definition of a gate that must pass for a phase transition to proceed. */
export interface GateDefinition {
	id: string;
	name: string;
	description: string;
	phaseId: FiscalPhaseId;
	/** Gate position: "entry" runs before phase starts, "exit" runs after phase completes */
	position: "entry" | "exit";
	evaluate: (
		state: FiscalPeriodState,
		context: PhaseGateContext,
	) => Promise<GateResult>;
}

/** Condition that determines auto-transition behavior. */
export interface GateCondition {
	type: "auto_pass" | "auto_fail" | "requires_approval";
	threshold?: number;
	expression?: string;
}

/** History entry for a completed/attempted phase within a period. */
export interface PhaseHistoryEntry {
	phaseId: FiscalPhaseId;
	status: PhaseStatus;
	startedAt: Date;
	completedAt?: Date;
	gateResults: GateResult[];
	agentOutput?: unknown;
	error?: string;
}

/** Full state for a single fiscal period of one RUC. */
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

/** State for a single phase execution (wider than history entry). */
export interface PhaseState {
	phaseId: FiscalPhaseId;
	status: PhaseStatus;
	startedAt?: Date;
	completedAt?: Date;
	gateResults: GateResult[];
	agentOutput?: unknown;
	error?: string;
}

/** Base interface for phase agent outputs. */
export interface PhaseAgentOutput {
	phaseId: FiscalPhaseId;
	ruc: string;
	periodo: string;
	success: boolean;
	summary: string;
	data: unknown;
}

/** Captura phase agent specific output. */
export interface CapturaReport extends PhaseAgentOutput {
	phaseId: "captura";
	data: {
		totalRecibidos: number;
		totalPendientes: number;
		totalErrores: number;
		comprobantes: Array<{ id: string; tipo: string; estado: string }>;
	};
}

/** Clasificación phase agent output. */
export interface ClasificacionReport extends PhaseAgentOutput {
	phaseId: "clasificacion";
	data: {
		totalProcesados: number;
		totalClasificados: number;
		totalAmbiguos: number;
		cobertura: number; // 0-1 ratio
		clasificaciones: Array<{
			comprobanteId: string;
			cuentaPCGE: string;
			confianza: number;
			igvCalculado: number;
		}>;
	};
}

/** Conciliación phase agent output. */
export interface ConciliacionReport extends PhaseAgentOutput {
	phaseId: "conciliacion";
	data: {
		totalTransacciones: number;
		paresConciliados: number;
		discrepancias: number;
		saldoLibro: number;
		saldoBanco: number;
		diferencia: number;
		variance: number; // 0-1 ratio of difference/saldoLibro
		detalleDiscrepancias: Array<{
			id: string;
			monto: number;
			tipo: string;
			descripcion: string;
		}>;
	};
}

/** Cierre phase agent output. */
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
		fechaCierre: string; // ISO date
	};
}

/** Declaración phase agent output. */
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

/** Auditoría phase agent output. */
export interface AuditoriaReport extends PhaseAgentOutput {
	phaseId: "auditoria";
	data: {
		confianza: number; // 0-1 overall confidence score
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

// ─── Auto-Advance Types ──────────────────────────────────────────

/**
 * Configuration for automatic phase advancement.
 * Controls when the orchestrator can skip human intervention.
 */
export interface AutoAdvanceConfig {
	/** Global minimum confidence to auto-advance (0-1). */
	minConfidence: number;
	/** Whether warning-level gate results block auto-advance. */
	blockOnWarnings: boolean;
	/** Per-phase overrides. */
	phaseOverrides?: Partial<
		Record<
			FiscalPhaseId,
			{
				enabled: boolean;
				minConfidence?: number;
				blockOnWarnings?: boolean;
			}
		>
	>;
}

/**
 * Context provided to auto-advance evaluators per phase.
 */
export interface AutoAdvanceContext {
	ruc: string;
	periodo: string;
	phaseId: FiscalPhaseId;
	gateResults: GateResult[];
	agentOutput?: unknown;
	metadata: Record<string, unknown>;
}

/**
 * Result of an auto-advance evaluation.
 */
export interface AutoAdvanceDecision {
	shouldAdvance: boolean;
	confidence: number;
	reason: string;
	blockingGates: string[];
}

/**
 * Evaluator function type for a single phase.
 * Returns true if the phase can safely auto-advance.
 */
export type PhaseAutoAdvanceEvaluator = (
	context: AutoAdvanceContext,
) => AutoAdvanceDecision;

// ─── Batch Orchestrator Types ────────────────────────────────────

/**
 * Configuration for the BatchOrchestrator.
 */
export interface BatchConfig {
	/** Maximum parallel RUCs to process simultaneously. */
	maxParallel: number;
	/** Auto-advance mode for batch processing. */
	autoAdvance: boolean;
	/** Global auto-advance config used when autoAdvance=true. */
	autoAdvanceConfig?: AutoAdvanceConfig;
}

/**
 * A single entry in a batch run.
 */
export interface BatchEntry {
	ruc: string;
	periodo: string;
	/** Optional per-entry override for auto-advance. */
	autoAdvance?: boolean;
	/** Optional per-entry metadata. */
	metadata?: Record<string, unknown>;
}

/**
 * Status of a single batch entry.
 */
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

/**
 * Aggregate status of a batch run.
 */
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

/** Callbacks for batch lifecycle events. */
export interface BatchCallbacks {
	onPhaseComplete?: (
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		state: FiscalPeriodState,
	) => Promise<void>;
	onPeriodComplete?: (
		ruc: string,
		periodo: string,
		state: FiscalPeriodState,
	) => Promise<void>;
	onPhaseBlocked?: (
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		blockers: GateResult[],
	) => Promise<void>;
	onError?: (
		ruc: string,
		periodo: string,
		phaseId: FiscalPhaseId,
		error: string,
	) => Promise<void>;
}

/** Graph definition — the full fiscal phase cycle. */
export interface FiscalPhaseGraph {
	phases: FiscalPhaseNode[];
	transitions: PhaseTransition[];
}

/** A node in the fiscal phase graph. */
export interface FiscalPhaseNode {
	id: FiscalPhaseId;
	label: string;
	description: string;
	entryGates: string[]; // GateDefinition IDs to evaluate before starting
	exitGates: string[]; // GateDefinition IDs to evaluate after completing
}

/** A directed edge between two phases. */
export interface PhaseTransition {
	from: FiscalPhaseId;
	to: FiscalPhaseId;
	condition: GateCondition;
	autoTransition: boolean;
}
