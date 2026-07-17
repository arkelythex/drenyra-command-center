/**
 * @arkelythex/platform-core — Public API.
 *
 * Domain-agnostic agent orchestration platform.
 * Zero fiscal imports — all types here are shared across all verticals.
 *
 * @module @arkelythex/platform-core
 */

export type {
	GatewayConfig,
	GatewayMetrics,
	GatewayRequest,
	GatewayResult,
	RateLimitConfig,
} from "./ai-gateway/gateway.js";
// ──────────────────────────────────────────────
// AI Gateway — Gateway Core
// ──────────────────────────────────────────────
export { AIGateway } from "./ai-gateway/gateway.js";
// ──────────────────────────────────────────────
// AI Gateway — Provider Interface
// ──────────────────────────────────────────────
export type {
	ChatCompletionRequest,
	ChatCompletionResult,
	ChatMessage,
	EmbeddingRequest,
	EmbeddingResult,
	LLMProvider,
	ProviderConfig,
	ProviderFactory,
	StreamChunk,
	TokenUsage,
} from "./ai-gateway/provider.js";
export type {
	ModelCapability,
	ModelCost,
	ModelRegistration,
	RateLimits,
} from "./ai-gateway/registry.js";
// ──────────────────────────────────────────────
// AI Gateway — Model Registry
// ──────────────────────────────────────────────
export { ModelRegistry } from "./ai-gateway/registry.js";
export type {
	Tool,
	ToolResult,
} from "./ai-gateway/tool-bridge.js";
// ──────────────────────────────────────────────
// AI Gateway — Tool Bridge
// ──────────────────────────────────────────────
export { ToolRegistry } from "./ai-gateway/tool-bridge.js";
// ──────────────────────────────────────────────
// AI Gateway — Legacy Types (stubs, kept for backward compat)
// ──────────────────────────────────────────────
export type { ModelConfig } from "./ai-gateway/types.js";
export type { Env } from "./config/env-schema.js";
// ──────────────────────────────────────────────
// Config — Shared env schema, logger, rate limiting
// ──────────────────────────────────────────────
export { EnvSchema, validateEnv } from "./config/env-schema.js";
export {
	createLogger,
	logOperation,
	logRequest,
	REDACTION_PLACEHOLDER,
	rootLogger,
} from "./config/logger.js";
export {
	lenientRateLimit,
	rateLimitMiddleware,
	standardRateLimit,
	strictRateLimit,
} from "./config/rate-limit.js";
export { ApprovalWorkflow } from "./harness/approval.js";
// ──────────────────────────────────────────────
// Harness — Delegation & Approval
// ──────────────────────────────────────────────
export { DelegationGraph } from "./harness/delegation.js";
export {
	type EvidenceStore,
	InMemoryEvidenceStore,
	type InMemoryEvidenceStoreOptions,
} from "./harness/evidence.js";
export type {
	ApprovalCondition,
	ApprovalConfig,
	ApprovalGate as HarnessApprovalGate,
	ApprovalRequest as HarnessApprovalRequest,
	DelegationConfig,
	DelegationNode,
	DelegationPath,
	EvidenceConfig,
	EvidenceQuery,
	EvidenceRecord,
} from "./harness/types.js";
// ──────────────────────────────────────────────
// Kernel — Error Hierarchy
// ──────────────────────────────────────────────
export {
	AgentError,
	isAgentError,
	isPluginValidationError,
	isTaskError,
	PluginValidationError,
	TaskError,
} from "./kernel/errors.js";
export type { EventEnvelope, EventHandler } from "./kernel/event-bus.js";
// ──────────────────────────────────────────────
// Kernel — Event Bus
// ──────────────────────────────────────────────
export { EventBus } from "./kernel/event-bus.js";
export type {
	LifecycleOptions,
	LifecycleTransition,
} from "./kernel/lifecycle.js";
// ──────────────────────────────────────────────
// Kernel — Agent Lifecycle
// ──────────────────────────────────────────────
export {
	AgentLifecycleManager,
	VALID_TRANSITIONS,
} from "./kernel/lifecycle.js";
// ──────────────────────────────────────────────
// Kernel — Core Types
// ──────────────────────────────────────────────
export type {
	AgentContext,
	AgentStatus,
	AgentType,
	TaskDefinition,
	TaskPriority,
	TaskResult,
	TaskStatus,
} from "./kernel/types.js";
// ──────────────────────────────────────────────
// Memory — Agent Session Storage
// ──────────────────────────────────────────────
export { MemoryStore, type MemoryStoreOptions } from "./memory/memory-store.js";
export type { SessionStore } from "./memory/session-store.js";
export {
	SqliteSessionStore,
	type SqliteSessionStoreOptions,
} from "./memory/sqlite-store.js";
export type {
	MemoryContext,
	MemoryContextQuery,
	MemoryRecord,
	MemoryScope,
	MemorySearchQuery,
	MemorySearchResult,
	SaveMemoryInput,
	SessionConfig,
	StoreConfig,
} from "./memory/types.js";
// ──────────────────────────────────────────────
// Plugin — Vertical Registration Contract
// ──────────────────────────────────────────────
export type {
	AgenticOSPlugin,
	AgentRegistry,
	ApprovalEvidence,
	ApprovalGate,
	ApprovalGateRegistry,
	ApprovalRequest,
	ApprovalVerdict,
	DomainRegistry,
	PolicyContext,
	PolicyDefinition,
	PolicyRegistry,
	PolicyResult,
} from "./plugin/interface.js";
export { PluginRegistry } from "./plugin/registry.js";
export type {
	PluginLifecycleConfig,
	RegisteredPlugin,
} from "./plugin/types.js";
export type {
	AgentExecutor,
	AggregationStrategy,
	OrchestratorMetrics,
} from "./swarm/orchestrator.js";
export { Orchestrator } from "./swarm/orchestrator.js";
export type {
	RegisteredAgent,
	RouterOptions,
	RouterStats,
} from "./swarm/router.js";
export { TaskRouter } from "./swarm/router.js";
// ──────────────────────────────────────────────
// Swarm — Agent Orchestration
// ──────────────────────────────────────────────
export type {
	OrchestratorConfig,
	RouterConfig,
	WorkerPoolConfig,
} from "./swarm/types.js";
export type { TaskExecutor, WorkerPoolMetrics } from "./swarm/worker-pool.js";
export { WorkerPool } from "./swarm/worker-pool.js";
