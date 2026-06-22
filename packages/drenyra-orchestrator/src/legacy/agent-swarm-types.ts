// ─── Ported from @arkelythex/agent-swarm/src/core/*.d.ts ────────────
import type { Agent, AgentResult, Task } from "../types/agent-core";

export type { Agent, AgentResult, Task };

export interface OrchestrationStrategy {
	type: "parallel" | "sequential" | "adaptive" | "router-based";
	maxConcurrency: number;
	timeout: number;
	retryFailedAgents: boolean;
	aggregationStrategy:
		| "weighted-voting"
		| "consensus"
		| "first-wins"
		| "all-results";
}

export interface OrchestrationContext {
	traceId: string;
	startTime: Date;
	strategy: OrchestrationStrategy;
	agents: string[];
	results: AgentResult[];
	errors: Error[];
}

export interface HealthStatus {
	status: "healthy" | "degraded" | "down";
	lastCheck: Date;
}

export interface RegistryDiscoveryCriteria {
	capabilities?: string[];
	priority?: number;
}

export interface BusMessage {
	from?: string;
	to?: string;
	data: unknown;
	timestamp?: Date;
}

export interface WorkerPoolMetrics {
	poolSize: number;
	availableWorkers: number;
	pendingTasks: number;
	tasksExecuted: number;
	tasksFailed: number;
	avgExecutionTime: number;
}

export interface DoraMetricsSnapshot {
	deploymentFrequency: { daily: number; weekly: number };
	leadTimeForChanges: { avg: number; median: number };
	changeFailureRate: number;
	meanTimeToRecovery: { avg: number; median: number };
}
