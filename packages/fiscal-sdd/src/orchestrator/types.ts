/**
 * FiscalComplianceOrchestrator — tipos específicos del orquestador.
 *
 * Extiende los tipos base de FiscalSDD con capacidades de gobierno:
 * routing de modelos, persistencia de artefactos, modos de ejecución,
 * y protección de carga de revisión.
 */

import type {
	GatekeeperVerdict,
	NewEvidenceArtifact,
	PhaseResult,
} from "../types";

// ============================================================================
// Fases del pipeline de cumplimiento fiscal
// ============================================================================

/** Las 6 fases del pipeline de cumplimiento fiscal. */
export type FaseName =
	| "solicitud"
	| "analisis"
	| "diseno"
	| "plan"
	| "migracion"
	| "auditoria";

export const FASES_ORDEN: readonly FaseName[] = [
	"solicitud",
	"analisis",
	"diseno",
	"plan",
	"migracion",
	"auditoria",
] as const;

export const FASE_LABELS: Record<FaseName, string> = {
	solicitud: "Solicitud de cambio normativo",
	analisis: "Análisis regulatorio",
	diseno: "Diseño de implementación",
	plan: "Plan de migración",
	migracion: "Migración fiscal",
	auditoria: "Auditoría de cumplimiento",
};

// ============================================================================
// Model Router
// ============================================================================

export type ModelProvider =
	| "deepseek"
	| "gemini"
	| "claude"
	| "openai"
	| "custom";

export interface ModelAssignment {
	/** Fase a la que aplica esta asignación. */
	fase: FaseName;
	/** Proveedor del modelo. */
	provider: ModelProvider;
	/** Identificador del modelo (ej: "deepseek-v4-flash"). */
	model: string;
	/** Prioridad: 0 = primario, 1+ = fallback. */
	priority: number;
	/** Razón de la asignación. */
	reason: string;
}

// ============================================================================
// Artifact Store
// ============================================================================

export type ArtifactStoreMode = "openspec" | "engram" | "hybrid" | "none";

export interface FaseArtifact {
	/** Nombre de la fase. */
	fase: FaseName;
	/** Estado de ejecución de la fase. */
	status: PhaseResult["status"];
	/** Input que recibió la fase. */
	input: unknown;
	/** Output que produjo la fase. */
	output: unknown;
	/** Resultados de los gates ejecutados. */
	gateResults: GatekeeperVerdict[];
	/** Artefactos de evidencia producidos. */
	evidence: NewEvidenceArtifact[];
	/** Errores ocurridos durante la ejecución. */
	errors: string[];
	/** Confianza del resultado (0-1). */
	confidence: number;
	/** Cuándo se ejecutó. */
	ejecutadoEn: string;
	/** Duración en milisegundos. */
	duracionMs: number;
}

export interface ArtifactStore {
	/** Persiste el artefacto de una fase. */
	save(changeId: string, artifact: FaseArtifact): Promise<void>;
	/** Carga el artefacto de una fase específica. */
	load(changeId: string, fase: FaseName): Promise<FaseArtifact | null>;
	/** Carga todos los artefactos de un cambio. */
	loadAll(changeId: string): Promise<Map<FaseName, FaseArtifact>>;
	/** Lista los IDs de cambios conocidos. */
	listChanges(): Promise<string[]>;
	/** Verifica que el store está disponible. */
	healthCheck(): Promise<boolean>;
}

// ============================================================================
// Preflight
// ============================================================================

export interface PreflightCheckResult {
	passed: boolean;
	name: string;
	severity: "BLOCKING" | "WARNING";
	reason?: string;
}

export interface FiscalScope {
	organizationId: string;
	companyId: string;
	companyRuc: string;
	period: string;
}

// ============================================================================
// Decision Gate
// ============================================================================

export type ExecutionMode = "auto" | "interactive" | "supervised";

export interface DecisionGateResult {
	/** Modo que se aplicó. */
	mode: ExecutionMode;
	/** Si requiere aprobación humana para continuar. */
	requiresApproval: boolean;
	/** Razón de la decisión. */
	reason: string;
	/** Umbral de confianza usado (solo auto). */
	autoThreshold?: number;
	/** Fases que requieren aprobación en modo supervised. */
	supervisedPhases?: FaseName[];
}

// ============================================================================
// Review Guard
// ============================================================================

export interface ReviewForecast {
	/** Líneas estimadas que modificará la migración. */
	estimatedLines: number;
	/** Riesgo de exceder el presupuesto. */
	budgetRisk: "LOW" | "MEDIUM" | "HIGH";
	/** Recomendación de PRs encadenados. */
	chainedPrsRecommended: boolean;
	/** Archivos estimados a tocar. */
	estimatedFiles: number;
	/** Subsistemas fiscales afectados. */
	affectedSubsystems: string[];
}

export type ReviewStrategy =
	| "ask-on-risk"
	| "auto-chain"
	| "single-pr"
	| "exception-ok";

export interface ReviewDecision {
	action: "proceed" | "split" | "ask";
	splitInto?: string[];
	reason: string;
}

// ============================================================================
// Orchestrator Config & Result
// ============================================================================

export interface OrchestratorConfig {
	/** Modo de ejecución: auto | interactive | supervised. */
	mode: ExecutionMode;
	/** Backend de artifact store. */
	artifactStore: ArtifactStoreMode;
	/** Límite de líneas por PR. */
	reviewBudget: number;
	/** Asignaciones de modelos por fase (opcional, usa defaults si no se provee). */
	modelAssignments?: ModelAssignment[];
	/** Si se habilita ejecución por sub-agentes. */
	subAgents?: boolean;
	/** Si se habilita Strict TDD mode. */
	strictTdd?: boolean;
	/** Directorio base para artifact store openspec. */
	openspecBasePath?: string;
}

export type OrchestratorStatus =
	| "COMPLETED"
	| "PREFLIGHT_BLOCKED"
	| "AWAITING_APPROVAL"
	| "FAILED"
	| "BLOCKED"
	| "REVIEW_NEEDED";

export interface OrchestratorResult {
	status: OrchestratorStatus;
	changeId: string;
	scope: FiscalScope;
	blockedAtFase?: FaseName;
	phaseArtifacts?: Map<FaseName, FaseArtifact>;
	message?: string;
	reasons?: string[];
	reviewDecision?: ReviewDecision;
}
