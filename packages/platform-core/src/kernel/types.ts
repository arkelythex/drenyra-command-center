/**
 * Domain-agnostic core types for the Platform Core kernel.
 * Zero fiscal imports — these types are shared across all verticals.
 *
 * @module @arkelythex/platform-core/kernel
 */

/**
 * Agent type identifier — a domain-specific string defined by plugins.
 * Examples: "analysis" | "compliance" | "audit"
 */
export type AgentType = string;

/**
 * Agent lifecycle status.
 */
export type AgentStatus = "idle" | "busy" | "error" | "completed" | "offline";

/**
 * Priority level for task scheduling and routing.
 */
export type TaskPriority = "low" | "medium" | "high" | "critical";

/**
 * Task execution lifecycle status.
 */
export type TaskStatus =
	| "pending"
	| "assigned"
	| "in_progress"
	| "completed"
	| "failed"
	| "cancelled";

/**
 * A unit of work dispatched to an agent.
 */
export interface TaskDefinition {
	/** Unique task identifier */
	id: string;
	/** The agent type that should handle this task */
	type: AgentType;
	/** Scheduling priority */
	priority: TaskPriority;
	/** Task input payload */
	input: Record<string, unknown>;
	/** Optional metadata for routing and auditing */
	metadata?: Record<string, unknown>;
	/** Maximum retry attempts on failure (default: 0 — no retry) */
	maxRetries?: number;
	/** Execution timeout in milliseconds */
	timeout?: number;
}

/**
 * The result of executing a task.
 */
export interface TaskResult {
	/** The originating task ID */
	taskId: string;
	/** Final execution status */
	status: TaskStatus;
	/** Optional execution output */
	output?: Record<string, unknown>;
	/** Error message if the task failed */
	error?: string;
	/** ISO timestamp of when execution started */
	startedAt: string;
	/** ISO timestamp of when execution completed (absent if still running) */
	completedAt?: string;
	/** Number of execution attempts made */
	attempts: number;
}

/**
 * Runtime context for an agent instance.
 */
export interface AgentContext {
	/** Unique agent instance identifier */
	agentId: string;
	/** The agent type this instance belongs to */
	type: AgentType;
	/** Current lifecycle status */
	status: AgentStatus;
	/** Set of capabilities this agent supports */
	capabilities: string[];
	/** Optional runtime metadata */
	metadata?: Record<string, unknown>;
}
