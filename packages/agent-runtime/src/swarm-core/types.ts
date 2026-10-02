/**
 * Swarm Module Types.
 *
 * Domain-agnostic types for the agent swarm orchestration module.
 * These interfaces will be implemented in Phase 2 (PR #2).
 *
 * @module @drenyra/platform-core/swarm
 */

/**
 * Configuration for the agent orchestrator.
 */
export interface OrchestratorConfig {
	/** Maximum number of concurrent worker agents */
	maxConcurrency?: number;
	/** Default task timeout in milliseconds */
	defaultTimeout?: number;
	/** Whether to retry failed agents */
	retryFailedAgents?: boolean;
}

/**
 * Configuration for the worker pool.
 */
export interface WorkerPoolConfig {
	/** Maximum number of concurrent workers */
	maxWorkers: number;
	/** Queue capacity before backpressure kicks in */
	queueCapacity?: number;
	/** Worker idle timeout in milliseconds */
	idleTimeoutMs?: number;
}

/**
 * Configuration for the task router.
 */
export interface RouterConfig {
	/** Default agent type to route unmatched tasks to */
	defaultAgentType?: string;
	/** Whether to use DORA metrics for adaptive routing */
	enableDoraRouting?: boolean;
	/** Maximum routing depth before delegation loop detection */
	maxRoutingDepth?: number;
}
