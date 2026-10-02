/**
 * Fiscal FSD — barrel exports
 */

export {
	createArtifactStore,
	FileArtifactStore,
	InMemoryArtifactStore,
} from "./orchestrator/artifact-store";
export { DecisionGate } from "./orchestrator/decision-gate";
export { FiscalComplianceOrchestrator } from "./orchestrator/fiscal-compliance-orchestrator";
export type { ProviderResolver } from "./orchestrator/model-router";
export {
	DEFAULT_MODEL_ASSIGNMENTS,
	ModelRouter,
} from "./orchestrator/model-router";
export type { PreflightResult } from "./orchestrator/preflight";
export {
	isValidPeriod,
	isValidRuc,
	PreflightValidator,
} from "./orchestrator/preflight";
// Orchestrator
export type {
	ArtifactStore,
	ArtifactStoreMode,
	DecisionGateResult,
	ExecutionMode,
	FaseArtifact,
	FaseName,
	FiscalScope,
	ModelAssignment,
	ModelProvider,
	OrchestratorConfig,
	OrchestratorResult,
	OrchestratorStatus,
	PreflightCheckResult,
	ReviewDecision,
	ReviewForecast,
	ReviewStrategy,
} from "./orchestrator/types";
export { FASES_ORDEN } from "./orchestrator/types";
export type { FiscalChangeMetadata, LLMCaller } from "./phases/fsd-phases";
export {
	createAnalisisPhase,
	createAuditoriaPhase,
	createDisenioPhase,
	createMigracionPhase,
	createPlanPhase,
	createSolicitudPhase,
} from "./phases/fsd-phases";
export { FISCAL_COMPLIANCE_PIPELINE } from "./pipelines/fsd-fiscal-pipeline";
export { INVOICE_PIPELINE } from "./pipelines/invoice-pipeline";
export {
	FiscalFSDRunner,
	PhaseExecutionError,
	PhaseGateBlockedError,
} from "./runner";
export type {
	FiscalFSDPipeline,
	FiscalPhaseDef,
	FiscalPhaseGate,
	GatekeeperVerdict,
	NewEvidenceArtifact,
	PhaseContext,
	PhaseResult,
	PipelineResult,
} from "./types";
