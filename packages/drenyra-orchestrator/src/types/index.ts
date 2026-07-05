// ─── Types Index ───────────────────────────────────────────────────
// Re-exporta todos los tipos locales (no dependen de @drenyra/agent-swarm)

export type { AgentContext } from "./agent-context";
export type {
	Agent,
	AgentCapability,
	AgentDefinition,
	AgentMetrics,
	AgentPort,
	AgentPriority,
	AgentResult,
	Task,
} from "./agent-core";
export type {
	ActionResult,
	AgentTool,
	AgentToolExecution,
} from "./agent-tool";
export type {
	ApprovalDecision,
	ApprovalLevel,
	ApprovalRequest,
	ApprovalState,
	GovernanceBundleResult,
} from "./approval-gate";
export {
	APPROVAL_LEVEL_ORDER,
	isFiscalAction,
	requiresGovernanceBundle,
	requiresHumanApproval,
} from "./approval-gate";
export type {
	AgentId,
	AgentIntent,
	AgentSession,
	DomainAgentConfig,
	LatinModernoAgentId,
	SessionContext,
	SwarmMode,
} from "./erp-types";
export { LATIN_AGENTS } from "./erp-types";
export type {
	DomainResult,
	EscalationContext,
	EscalationResolution,
	LatinAgentId,
	SubAgentResult,
	SubSwarmContext,
	SubSwarmTask,
	SwarmContext,
	SwarmTask,
	TaskDecompositionResult,
	TaskPlanType,
} from "./latin-agent";

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
} from "./worker-task";
