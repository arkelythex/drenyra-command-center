/**
 * Agent Execution Metrics
 *
 * Prometheus counters and histograms for agent execution observability.
 * Registered globally — import and use in any execution path.
 *
 * @module ai-swarm/api/agents-metrics
 */

import { Counter, Histogram } from "prom-client";

/**
 * Agent execution counter (by agent_id + status)
 */
export const agentExecutionsTotal = new Counter({
	name: "drenyra_agent_executions_total",
	help: "Total number of agent executions",
	labelNames: ["agent_id", "status"] as const,
});

/**
 * Agent execution duration in seconds (by agent_id)
 */
export const agentExecutionDuration = new Histogram({
	name: "drenyra_agent_execution_duration_seconds",
	help: "Agent execution duration in seconds",
	labelNames: ["agent_id"] as const,
	buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
});

/**
 * Agent execution error counter (by agent_id + error_type)
 */
export const agentExecutionErrors = new Counter({
	name: "drenyra_agent_execution_errors_total",
	help: "Total number of agent execution errors",
	labelNames: ["agent_id", "error_type"] as const,
});
