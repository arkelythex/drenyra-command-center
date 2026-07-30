/**
 * @drenyra/pi — Drenyra Agent Harness
 *
 * Standalone agent runtime extracted from @drenyra/agents.
 * Provides orchestration, harness, delegation, approval gates,
 * fiscal strategies, and agent type definitions.
 *
 * @module @drenyra/pi
 */

// ─── Legacy (temporary) ───────────────────────────
export { QueueManager, queueManager } from "./legacy/queue-manager";

// ─── Agents module ──────────────────────────────
export * from "./agents";
export * from "./fiscal-agentic-ledger";
export {
	createDefaultHandler,
	registerDefaultHandlers,
} from "./harness/handlers/defaults";
// ─── Harness — Delegation, Approval, Execution ─────────────────────────
export { createDrenyraHarness, DrenyraHarness } from "./harness/harness";

// ─── Pi Adapter — Hexagonal AgentRuntimePort ────────────────────────────
export type { AgentRuntimePort, SessionHandle, FiscalPrompt, RuntimeEvent, RuntimeEventType, CreateSessionRequest, ForkSessionRequest, Unsubscribe, ShadowComparison } from "@drenyra/pi-adapter";
export { PiAgentRuntimeAdapter, LegacyMastraRuntimeAdapter, ShadowRunner } from "@drenyra/pi-adapter";

// ─── Fiscal Agent Domain — Pure domain types ────────────────────────────
export type { AgentDefinition, AgentCapability } from "@drenyra/fiscal-agent-domain/agent-definition";
export type { DelegationPolicy, DelegationRule } from "@drenyra/fiscal-agent-domain/delegation-policy";
export type { ApprovalPolicy, ApprovalRequirement, ApprovalLevel } from "@drenyra/fiscal-agent-domain/approval-policy";
export { compareApprovalLevel, requiresHumanApproval, requiresGovernanceBundle } from "@drenyra/fiscal-agent-domain/approval-policy";
export type { RiskTier, Jurisdiction } from "@drenyra/fiscal-agent-domain/risk-tier";
export type { AgentContext } from "@drenyra/fiscal-agent-domain/agent-context";
export type {
	AgentHandler,
	HarnessExecuteResponse,
	HarnessOptions,
} from "./harness/types";
// ─── Lexori — Fiscal/Regulatory Skill Registry ────────────────────────
export * from "./lexori";
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
// ─── Mnevori — Per-Node Artifact Persistence ──────────────────────────
export * from "./mnevori";
// ─── MCP Protocol ─────────────────────────────────────────────────────
export type {
	DrenyraMcpAuditEvent,
	DrenyraMcpAuditOutcome,
	DrenyraMcpAuditQuery,
	DrenyraMcpAuditReader,
	DrenyraMcpAuditSink,
	DrenyraMcpAuthorizationDecision,
	DrenyraMcpAuthorizationInput,
	DrenyraMcpManifest,
	DrenyraMcpScope,
	DrenyraMcpToolContract,
} from "./protocol/mcp-contract";
export {
	authorizeDrenyraMcpTool,
	buildDrenyraMcpManifest,
	isDrenyraMcpScope,
} from "./protocol/mcp-contract";
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

// ─── Plugin System ───────────────────────────────────────────────────────
export type {
	AgenticOSPlugin,
	AgentRegistry,
	ApprovalEvidence,
	ApprovalGate,
	ApprovalGateRegistry,
	ApprovalVerdict,
	DomainRegistry,
	DrenyraSkill,
	PolicyContext,
	PolicyDefinition,
	PolicyRegistry,
	PolicyResult,
	SkillContext,
} from "./plugin/interface";
export { PluginRegistry } from "./plugin/registry";
export type {
	PluginLifecycleConfig,
	RegisteredPlugin,
} from "./plugin/types";

// ─── Legacy compatibility layer ──────────────────────────────
export {
	clearRegisteredAgents,
	getAllRegisteredAgents,
	getRegisteredAgent,
} from "./legacy/agent-registry";
export type {
	LegacyCapabilityToolsLookupInput,
	LegacyPolicyPreviewInput,
	NormalizedLegacyCapabilityToolsLookup,
} from "./legacy/control-plane-facade";
export {
	createGovernanceValidator,
	normalizeLegacyCapabilityToolsLookup,
	normalizeLegacyPolicyPreviewInput,
} from "./legacy/control-plane-facade";
export type {
	NormalizedLegacyPolicyPreview,
} from "./legacy/control-plane-facade";
