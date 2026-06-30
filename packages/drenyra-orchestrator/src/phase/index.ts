// ─── Drenyra Phase Layer — Public API ──────────────────────────────

export {
	createEngramGateEvidenceRecorder,
	createEngramGateEvidenceRecorderFromEnv,
	EngramHttpClient,
} from "../engram/engram-client";
// Auto-Advance Engine
export {
	AutoAdvanceEngine,
	buildAutoAdvanceContext,
	DEFAULT_AUTO_ADVANCE_CONFIG,
} from "./auto-advance-engine";
// Batch Orchestrator
export { BatchOrchestrator } from "./batch-orchestrator";
export type {
	FiscalConfidenceGatesConfig,
	PhaseConfidenceConfig,
} from "./confidence-gates";
// Confidence Gates
export {
	confidenceGate,
	getPhaseConfidenceThreshold,
	loadConfidenceGateConfig,
	registerConfidenceGates,
	resetConfidenceGateConfigCache,
} from "./confidence-gates";
// Store
export { DrizzleFiscalPhaseStore } from "./drizzle-fiscal-phase-store";
// Fiscal Gates
export {
	capturaCompleteGate,
	capturaDoneGate,
	cierreApprovalGate,
	cierreDoneGate,
	clasificacionCompleteGate,
	clasificacionDoneGate,
	conciliacionDoneGate,
	conciliacionVarianceGate,
	declaracionDoneGate,
	declaracionFiledGate,
	periodoOpenGate,
	registerFiscalGates,
} from "./fiscal-gates";
// Graph
export {
	createDefaultPhaseGraph,
	getNextPhase,
	getPreviousPhase,
	isValidTransition,
	PHASE_DESCRIPTIONS,
	PHASE_LABELS,
	PHASE_ORDER,
	validateGraph,
} from "./fiscal-phase-graph";
export type {
	FiscalPhaseOrchestratorConfig,
	PhaseExecutionResult,
	PhaseOperationResult,
} from "./fiscal-phase-orchestrator";
// Orchestrator
export { FiscalPhaseOrchestrator } from "./fiscal-phase-orchestrator";
export type { FiscalPhaseStore } from "./fiscal-phase-store";
export { InMemoryFiscalPhaseStore } from "./fiscal-phase-store";
export type {
	GateEvidenceRecord,
	GateEvidenceRecorder,
	GateEvidenceTier,
} from "./gate-evidence-recorder";
export {
	createInMemoryGateEvidenceRecorder,
	gateResultToEvidenceRecord,
	recordGateEvidence,
} from "./gate-evidence-recorder";
export type { AuditoriaAgentInput } from "./phase-agents/auditoria.agent";
export { AuditoriaAgent } from "./phase-agents/auditoria.agent";
export type { CapturaAgentInput } from "./phase-agents/captura.agent";
// Phase Agents
export { CapturaAgent } from "./phase-agents/captura.agent";
export type { CierreAgentInput } from "./phase-agents/cierre.agent";
export { CierreAgent } from "./phase-agents/cierre.agent";
export type { ClasificacionAgentInput } from "./phase-agents/clasificacion.agent";
export { ClasificacionAgent } from "./phase-agents/clasificacion.agent";
export type { ConciliacionAgentInput } from "./phase-agents/conciliacion.agent";
export { ConciliacionAgent } from "./phase-agents/conciliacion.agent";
export type { DeclaracionAgentInput } from "./phase-agents/declaracion.agent";
export { DeclaracionAgent } from "./phase-agents/declaracion.agent";
export type { GateEvaluationResult } from "./phase-gate-engine";
// Gate Engine
export { PhaseGateEngine } from "./phase-gate-engine";
export type {
	ClassifyResult,
	ExtractResult,
	ReconcileResult,
	TransactionContext,
} from "./transaction-integration";
// Transaction Integration
export { TransactionIntegration } from "./transaction-integration";
// Types
export type {
	AuditoriaReport,
	AutoAdvanceConfig,
	AutoAdvanceContext,
	AutoAdvanceDecision,
	BatchCallbacks,
	BatchConfig,
	BatchEntry,
	BatchEntryStatus,
	BatchStatus,
	CapturaReport,
	CierreReport,
	ClasificacionReport,
	ConciliacionReport,
	DeclaracionReport,
	FiscalPeriodState,
	FiscalPhaseGraph,
	FiscalPhaseId,
	FiscalPhaseNode,
	GateCondition,
	GateDefinition,
	GateResult,
	GateSeverity,
	PhaseAgentOutput,
	PhaseAutoAdvanceEvaluator,
	PhaseGateContext,
	PhaseHistoryEntry,
	PhaseState,
	PhaseStatus,
	PhaseTransition,
} from "./types";

// OSE Fiscal Document Service
export type {
	CpeSubmitInput,
	CpeSubmitResult,
	FiscalDocumentService,
	PeriodDeclarationInput,
	PeriodDeclarationResult,
} from "./types/ose-fiscal-service";
