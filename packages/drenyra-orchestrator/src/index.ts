// ─── Drenyra Orchestrator — Public API ──────────────────────────────
//
// ⚠️  GENTLE-AI: Solo exportamos lo que los consumidores realmente usan.
//     Filosofía: si nadie lo importa, no existe.
//
// Punto de entrada único para `import { ... } from '@arkelythex/drenyra-orchestrator'`

// ─── Agent-Swarm Compat Types (snapshots locales) ─────────────────────
// Estos tipos son el contrato público entre la API y el orquestador.
// Fueron extraídos de @arkelythex/agent-swarm y ahora viven aquí.

export type { AgentContext } from "./types/agent-context";
export type {
	Agent,
	AgentCapability,
	AgentDefinition,
	AgentMetrics,
	AgentPort,
	AgentPriority,
	AgentResult,
	Task,
} from "./types/agent-core";
export type {
	ActionResult,
	AgentTool,
	AgentToolExecution,
} from "./types/agent-tool";
export type {
	ApprovalDecision,
	ApprovalLevel,
	ApprovalRequest,
	ApprovalState,
	GovernanceBundleResult,
} from "./types/approval-gate";
export {
	APPROVAL_LEVEL_ORDER,
	isFiscalAction,
	requiresGovernanceBundle,
	requiresHumanApproval,
} from "./types/approval-gate";
export type {
	AgentId,
	AgentIntent,
	AgentSession,
	DomainAgentConfig,
	LatinModernoAgentId,
	SessionContext,
	SwarmMode,
} from "./types/erp-types";
export { LATIN_AGENTS } from "./types/erp-types";
export type {
	DomainResult,
	EscalationContext,
	EscalationResolution,
	LatinAgentId,
	SubSwarmContext,
	SubSwarmTask,
	SwarmContext,
	SwarmTask,
	TaskDecompositionResult,
	TaskPlanType,
} from "./types/latin-agent";
export type {
	AIWorkerTask,
	CreateTaskDTO,
	QueueStatsDTO,
	TaskHandlerFunction,
	TaskHandlerRegistry,
	TaskHandlerResult,
	TaskStatusDTO,
	WorkerTaskPriority,
	WorkerTaskStatus,
} from "./types/worker-task";

// ─── Mastra Implementations ──────────────────────────────────────────
//
// Reemplazan @arkelythex/agent-swarm (63K lines) con implementaciones
// limpias basadas en Mastra + Vercel AI SDK.

export type {
	ApprovalResult,
	AuditEvent,
	AuditMemoryCandidateInput,
	AuditReport,
	Classification,
	ClassificationRisk,
	ClassifierReport,
	ComplianceAssessmentResult,
	ComplianceContext,
	ComplianceEvidenceRef,
	ComplianceFinding,
	ComplianceReportBase,
	ComplianceSeverity,
	Conflict,
	ConsentRecord,
	ConsentReport,
	DataCategory,
	FiscalEvent,
	FiscalEventHandler,
	FiscalEventType,
	FiscalMemoryCandidate,
	FiscalMemoryCandidateCategory,
	FiscalMemoryCandidateSeverity,
	GDPRCheck,
	GDPRReport,
	GDPRSeverity,
	GDPRStatus,
	GDPRViolation,
	IntentHandler,
	IntentRule,
	LatinOrchestrationResult,
	MaterialAction,
	MergeResult,
	OrchestrationResult,
	PhaseTiming,
	PrivacyMemoryCandidateInput,
	PrivacyReport,
	Regulation,
	RegulationMemoryCandidateInput,
	RegulationReport,
	RegulationStatus,
	RetentionAction,
	RetentionPolicy,
	RetentionReport,
	SubAgentResult,
	TaskStep,
} from "./mastra";
// ─── Compliance Sub-Agents ──────────────────────────────────────────
export {
	AgentEventBus,
	ApprovalGateEngine,
	ApprovalStore,
	auditLoggerAgent,
	auditLoggerPort,
	complianceAssessmentAgent,
	complianceCheckWorkflow,
	consentManagerAgent,
	consentManagerPort,
	createAuditLoggerMemoryCandidates,
	createDrenyraOrchestrator,
	createFindingTool,
	createFiscalMemoryCandidate,
	createPrivacyMemoryCandidates,
	createRegulationMemoryCandidates,
	DomainAgent,
	DrenyraOrchestrator as MastraDrenyraOrchestrator,
	dataClassifierAgent,
	dataClassifierPort,
	dataRetentionAgent,
	dataRetentionPort,
	gdprCheckerAgent,
	gdprCheckerPort,
	IntentDetector,
	LatinModernoOrchestrator,
	privacyAssessorAgent,
	privacyAssessorPort,
	ResultMerger,
	redactTool,
	regulationTrackerAgent,
	regulationTrackerPort,
	riskScoreTool,
	runComplianceAssessment,
	SessionManager,
	Supervisor,
	TaskDecomposer,
} from "./mastra";

// ─── Legacy Functions ──────────────────────────────────────────────────
// Portadas de @arkelythex/agent-swarm para compatibilidad.

export {
	clearRegisteredAgents,
	createGovernanceValidator,
	getAllRegisteredAgents,
	getRegisteredAgent,
	normalizeLegacyCapabilityToolsLookup,
	normalizeLegacyPolicyPreviewInput,
	QueueManager,
	queueManager,
} from "./legacy";
