// ─── Types Index ───────────────────────────────────────────────────
// Re-exporta todos los tipos locales (no dependen de @drenyra/agent-swarm)

export type { AgentContext } from './agent-context';

export type {
  ApprovalLevel,
  ApprovalState,
  ApprovalRequest,
  ApprovalDecision,
  GovernanceBundleResult,
} from './approval-gate';

export {
  APPROVAL_LEVEL_ORDER,
  isFiscalAction,
  requiresHumanApproval,
  requiresGovernanceBundle,
} from './approval-gate';

export type {
  AgentCapability,
  AgentPriority,
  Task,
  AgentMetrics,
  AgentResult,
  AgentPort,
  Agent,
  AgentDefinition,
} from './agent-core';

export type {
  AgentTool,
  ActionResult,
  AgentToolExecution,
} from './agent-tool';

export type { LatinAgentId } from './latin-agent';

export type {
  AgentId,
  AgentIntent,
  AgentSession,
  LatinModernoAgentId,
  SwarmMode,
  DomainAgentConfig,
  SessionContext,
} from './erp-types';

export { LATIN_AGENTS } from './erp-types';

export type {
  SwarmTask,
  SwarmContext,
  SubSwarmTask,
  SubSwarmContext,
  DomainResult,
  SubAgentResult,
  EscalationContext,
  EscalationResolution,
  TaskDecompositionResult,
  TaskPlanType,
} from './latin-agent';

export type {
  CreateTaskDTO,
  AIWorkerTask,
  WorkerTaskStatus,
  WorkerTaskPriority,
  TaskStatusDTO,
  TaskHandlerResult,
  TaskHandlerFunction,
  TaskHandlerRegistry,
  QueueStatsDTO,
} from './worker-task';
