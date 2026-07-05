/**
 * @drenyra/agents — Unified Agent Runtime
 *
 * Consolidates agent orchestration, harness, delegation, approval gates,
 * and agent type definitions previously scattered across:
 *   - @drenyra/drenyra-orchestrator
 *   - @drenyra/harness
 *   - @drenyra/platform-core (swarm, harness)
 *   - @drenyra/ai (agents, governance, control-plane)
 *
 * @module @drenyra/agents
 */

// ─── Harness — Delegation, Approval, Execution ─────────────────────────
export { createDrenyraHarness, DrenyraHarness } from "./harness/harness";
export type {
	HarnessExecuteResponse,
	HarnessOptions,
	AgentHandler,
} from "./harness/types";
export {
	createDefaultHandler,
	registerDefaultHandlers,
} from "./harness/handlers/defaults";

// ─── Agent Types (from drenyra-orchestrator) ──────────────────────────
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

// ─── Mastra Implementations ───────────────────────────────────────────
export type {
	ApprovalResult,
	AuditEvent,
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
	PrivacyReport,
	Regulation,
	RegulationReport,
	RegulationStatus,
	RetentionAction,
	RetentionPolicy,
	RetentionReport,
	SubAgentResult,
	TaskStep,
} from "./mastra";
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

// ─── MCP Protocol ─────────────────────────────────────────────────────
export type {
	DrenyraMcpAuditEvent,
	DrenyraMcpAuditOutcome,
	DrenyraMcpAuditQuery,
	DrenyraMcpAuditReader,
	DrenyraMcpAuditSink,
	DrenyraMcpScope,
	DrenyraMcpManifest,
	DrenyraMcpAuthorizationInput,
	DrenyraMcpAuthorizationDecision,
	DrenyraMcpToolContract,
} from "./protocol/mcp-contract";
export {
	buildDrenyraMcpManifest,
	isDrenyraMcpScope,
	authorizeDrenyraMcpTool,
} from "./protocol/mcp-contract";
