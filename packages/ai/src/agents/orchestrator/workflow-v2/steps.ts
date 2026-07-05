import type { AgentMetrics } from "./types";

class CircuitBreaker {
	private failures = 0;
	private lastFailureTime?: number;
	private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

	constructor(
		private threshold: number,
		private timeoutMs: number,
	) {}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		if (this.state === "OPEN") {
			if (Date.now() - (this.lastFailureTime || 0) > this.timeoutMs) {
				this.state = "HALF_OPEN";
			} else {
				throw new Error("Circuit breaker is OPEN");
			}
		}

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	private onSuccess(): void {
		this.failures = 0;
		this.state = "CLOSED";
	}

	private onFailure(): void {
		this.failures++;
		this.lastFailureTime = Date.now();
		if (this.failures >= this.threshold) {
			this.state = "OPEN";
		}
	}

	getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
		return this.state;
	}
}

class AgentMetricsCollector {
	private metrics: Map<string, AgentMetrics[]> = new Map();

	startAgent(agentName: string): AgentMetrics {
		const metric: AgentMetrics = {
			agentName,
			startTime: Date.now(),
			status: "running",
			retryCount: 0,
		};
		return metric;
	}

	finishAgent(
		metric: AgentMetrics,
		status: "success" | "failed" | "timeout",
		error?: Error,
	): void {
		metric.endTime = Date.now();
		metric.duration = metric.endTime - metric.startTime;
		metric.status = status;
		if (error) metric.error = error;

		const agentMetrics = this.metrics.get(metric.agentName) || [];
		agentMetrics.push(metric);
		this.metrics.set(metric.agentName, agentMetrics);
	}

	getMetrics(agentName?: string): AgentMetrics[] | Map<string, AgentMetrics[]> {
		if (agentName) {
			return this.metrics.get(agentName) || [];
		}
		return this.metrics;
	}

	getSuccessRate(agentName: string): number {
		const agentMetrics = this.metrics.get(agentName) || [];
		if (agentMetrics.length === 0) return 0;
		const successful = agentMetrics.filter(
			(m) => m.status === "success",
		).length;
		return successful / agentMetrics.length;
	}

	getAverageProcessingTime(agentName: string): number {
		const agentMetrics = this.metrics.get(agentName) || [];
		const completed = agentMetrics.filter((m) => m.duration !== undefined);
		if (completed.length === 0) return 0;
		const total = completed.reduce((sum, m) => sum + (m.duration || 0), 0);
		return total / completed.length;
	}
}

export { AgentMetricsCollector, CircuitBreaker };
