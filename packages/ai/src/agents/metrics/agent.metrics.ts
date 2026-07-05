/**
 * Agent Metrics System - Prometheus-compatible metrics for AI Agent Swarm
 *
 * Features:
 * - Processing time histograms
 * - Success/failure counters
 * - Active agents gauge
 * - Conflict detection rate
 * - API cost tracking
 *
 * @version 1.0.0
 * @example
 * ```ts
 * const value: MetricValue = {} as MetricValue;
 * console.log(value);
 * ```
 */

export interface MetricValue {
	value: number;
	timestamp: number;
	labels: Record<string, string>;
}

/**
 * CounterMetric interface.
 *
 * @example
 * ```ts
 * const value: CounterMetric = {} as CounterMetric;
 * console.log(value);
 * ```
 */
export interface CounterMetric {
	name: string;
	help: string;
	type: "counter";
	values: MetricValue[];
}

/**
 * GaugeMetric interface.
 *
 * @example
 * ```ts
 * const value: GaugeMetric = {} as GaugeMetric;
 * console.log(value);
 * ```
 */
export interface GaugeMetric {
	name: string;
	help: string;
	type: "gauge";
	values: MetricValue[];
}

/**
 * HistogramMetric interface.
 *
 * @example
 * ```ts
 * const value: HistogramMetric = {} as HistogramMetric;
 * console.log(value);
 * ```
 */
export interface HistogramMetric {
	name: string;
	help: string;
	type: "histogram";
	buckets: number[];
	values: Array<{
		value: number;
		timestamp: number;
		labels: Record<string, string>;
		bucket: string;
	}>;
}

/**
 * Metric type.
 *
 * @example
 * ```ts
 * const value: Metric = {} as Metric;
 * console.log(value);
 * ```
 */
export type Metric = CounterMetric | GaugeMetric | HistogramMetric;
type HistogramMetricValue = HistogramMetric["values"][number];

// ============================================================================
// AGENT METRICS COLLECTOR
// ============================================================================

/**
 * AgentMetricsCollector class.
 *
 * @example
 * ```ts
 * const value = new AgentMetricsCollector();
 * console.log(value);
 * ```
 */
export class AgentMetricsCollector {
	private metrics: Map<string, Metric> = new Map();
	private readonly defaultBuckets = [
		10, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
	];

	constructor() {
		this.initializeMetrics();
	}

	private initializeMetrics(): void {
		// Processing time histogram
		this.metrics.set("agent_processing_duration_ms", {
			name: "agent_processing_duration_ms",
			help: "Time spent processing by agent in milliseconds",
			type: "histogram",
			buckets: this.defaultBuckets,
			values: [],
		});

		// Success counter
		this.metrics.set("agent_processing_success_total", {
			name: "agent_processing_success_total",
			help: "Total number of successful agent executions",
			type: "counter",
			values: [],
		});

		// Failure counter
		this.metrics.set("agent_processing_failures_total", {
			name: "agent_processing_failures_total",
			help: "Total number of failed agent executions",
			type: "counter",
			values: [],
		});

		// Active agents gauge
		this.metrics.set("agent_active_count", {
			name: "agent_active_count",
			help: "Number of currently active agents",
			type: "gauge",
			values: [],
		});

		// Retry counter
		this.metrics.set("agent_retries_total", {
			name: "agent_retries_total",
			help: "Total number of agent retries",
			type: "counter",
			values: [],
		});

		// Conflict detection counter
		this.metrics.set("agent_conflicts_detected_total", {
			name: "agent_conflicts_detected_total",
			help: "Total number of conflicts detected between agents",
			type: "counter",
			values: [],
		});

		// API cost tracking
		this.metrics.set("agent_api_cost_usd", {
			name: "agent_api_cost_usd",
			help: "Total API cost in USD per agent",
			type: "counter",
			values: [],
		});

		// Circuit breaker state
		this.metrics.set("agent_circuit_breaker_opens_total", {
			name: "agent_circuit_breaker_opens_total",
			help: "Total number of times circuit breaker opened",
			type: "counter",
			values: [],
		});
	}

	// ============================================================================
	// RECORD METHODS
	// ============================================================================

	/**
	 * Record processing time for an agent
	 */
	recordProcessingTime(
		agentName: string,
		durationMs: number,
		status: "success" | "failure",
	): void {
		const metric = this.metrics.get(
			"agent_processing_duration_ms",
		) as HistogramMetric;
		const bucket = this.findBucket(durationMs);

		metric.values.push({
			value: durationMs,
			timestamp: Date.now(),
			labels: { agent: agentName, status },
			bucket,
		});

		// Keep only last 1000 values to prevent memory bloat
		if (metric.values.length > 1000) {
			metric.values = metric.values.slice(-1000);
		}
	}

	/**
	 * Record successful agent execution
	 */
	recordSuccess(agentName: string): void {
		const metric = this.metrics.get(
			"agent_processing_success_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName },
		});
		// Prevent memory bloat - keep only last 10000 values
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	/**
	 * Record failed agent execution
	 */
	recordFailure(agentName: string, errorType: string): void {
		const metric = this.metrics.get(
			"agent_processing_failures_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName, error_type: errorType },
		});
		// Prevent memory bloat
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	/**
	 * Set active agents count
	 */
	setActiveAgents(count: number): void {
		const metric = this.metrics.get("agent_active_count") as GaugeMetric;
		metric.values.push({
			value: count,
			timestamp: Date.now(),
			labels: {},
		});
		// Prevent memory bloat
		if (metric.values.length > 1000) {
			metric.values = metric.values.slice(-1000);
		}
	}

	/**
	 * Record agent retry
	 */
	recordRetry(agentName: string): void {
		const metric = this.metrics.get("agent_retries_total") as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName },
		});
		// Prevent memory bloat
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	/**
	 * Record conflict detection
	 */
	recordConflict(agentNames: string[]): void {
		const metric = this.metrics.get(
			"agent_conflicts_detected_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agents: agentNames.join(",") },
		});
		// Prevent memory bloat
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	/**
	 * Record API cost
	 */
	recordApiCost(agentName: string, costUsd: number, model: string): void {
		const metric = this.metrics.get("agent_api_cost_usd") as CounterMetric;
		metric.values.push({
			value: costUsd,
			timestamp: Date.now(),
			labels: { agent: agentName, model },
		});
		// Prevent memory bloat
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	/**
	 * Record circuit breaker open
	 */
	recordCircuitBreakerOpen(agentName: string): void {
		const metric = this.metrics.get(
			"agent_circuit_breaker_opens_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName },
		});
		// Prevent memory bloat
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	// ============================================================================
	// QUERY METHODS
	// ============================================================================

	/**
	 * Get success rate for an agent
	 */
	getSuccessRate(agentName: string, timeWindowMs: number = 3600000): number {
		const now = Date.now();
		const cutoff = now - timeWindowMs;

		const successMetric = this.metrics.get(
			"agent_processing_success_total",
		) as CounterMetric;
		const failureMetric = this.metrics.get(
			"agent_processing_failures_total",
		) as CounterMetric;

		const successes = successMetric.values.filter(
			(v) => v.labels.agent === agentName && v.timestamp >= cutoff,
		).length;

		const failures = failureMetric.values.filter(
			(v) => v.labels.agent === agentName && v.timestamp >= cutoff,
		).length;

		const total = successes + failures;
		return total === 0 ? 0 : successes / total;
	}

	/**
	 * Get average processing time for an agent
	 */
	getAverageProcessingTime(
		agentName: string,
		timeWindowMs: number = 3600000,
	): number {
		const now = Date.now();
		const cutoff = now - timeWindowMs;

		const metric = this.metrics.get(
			"agent_processing_duration_ms",
		) as HistogramMetric;
		const values = metric.values.filter(
			(v) => v.labels.agent === agentName && v.timestamp >= cutoff,
		);

		if (values.length === 0) return 0;

		const sum = values.reduce((acc, v) => acc + v.value, 0);
		return sum / values.length;
	}

	/**
	 * Get p95 processing time for an agent
	 */
	getP95ProcessingTime(
		agentName: string,
		timeWindowMs: number = 3600000,
	): number {
		const now = Date.now();
		const cutoff = now - timeWindowMs;

		const metric = this.metrics.get(
			"agent_processing_duration_ms",
		) as HistogramMetric;
		const values = metric.values
			.filter((v) => v.labels.agent === agentName && v.timestamp >= cutoff)
			.map((v) => v.value)
			.sort((a, b) => a - b);

		if (values.length === 0) return 0;

		const index = Math.floor(values.length * 0.95);
		return values[index];
	}

	/**
	 * Get total API cost
	 */
	getTotalApiCost(timeWindowMs?: number): number {
		const metric = this.metrics.get("agent_api_cost_usd") as CounterMetric;
		let values = metric.values;

		if (timeWindowMs) {
			const cutoff = Date.now() - timeWindowMs;
			values = values.filter((v) => v.timestamp >= cutoff);
		}

		return values.reduce((sum, v) => sum + v.value, 0);
	}

	/**
	 * Get all metrics for Prometheus export
	 */
	getPrometheusMetrics(): string {
		const lines: string[] = [];

		this.metrics.forEach((metric) => {
			lines.push(`# HELP ${metric.name} ${metric.help}`);
			lines.push(`# TYPE ${metric.name} ${metric.type}`);

			if (metric.type === "histogram") {
				// Export histogram buckets
				const buckets = new Map<string, number>();
				metric.values.forEach((v: HistogramMetricValue) => {
					const key = `${metric.name}_bucket{le="${v.bucket}"${this.formatLabels(v.labels)}}`;
					buckets.set(key, (buckets.get(key) || 0) + 1);
				});

				buckets.forEach((count, key) => {
					lines.push(`${key} ${count}`);
				});

				// Export sum and count
				const sum = metric.values.reduce(
					(acc: number, v: HistogramMetricValue) => acc + v.value,
					0,
				);
				lines.push(`${metric.name}_sum ${sum}`);
				lines.push(`${metric.name}_count ${metric.values.length}`);
			} else {
				// Counter and gauge
				const aggregated = this.aggregateMetricValues(metric);
				aggregated.forEach((value, labels) => {
					lines.push(`${metric.name}${labels} ${value}`);
				});
			}

			lines.push("");
		});

		return lines.join("\n");
	}

	/**
	 * Get metrics as JSON for API responses
	 */
	getMetricsJson(): Record<string, unknown> {
		return {
			agents: {
				reader: {
					successRate: this.getSuccessRate("reader"),
					avgProcessingTime: this.getAverageProcessingTime("reader"),
					p95ProcessingTime: this.getP95ProcessingTime("reader"),
				},
				parser: {
					successRate: this.getSuccessRate("parser"),
					avgProcessingTime: this.getAverageProcessingTime("parser"),
					p95ProcessingTime: this.getP95ProcessingTime("parser"),
				},
				validator: {
					successRate: this.getSuccessRate("validator"),
					avgProcessingTime: this.getAverageProcessingTime("validator"),
					p95ProcessingTime: this.getP95ProcessingTime("validator"),
				},
			},
			totalApiCost: this.getTotalApiCost(),
			activeAgents: this.getActiveAgentsCount(),
		};
	}

	/**
	 * Get active agents count
	 */
	getActiveAgentsCount(): number {
		const metric = this.metrics.get("agent_active_count") as GaugeMetric;
		if (metric.values.length === 0) return 0;
		return metric.values[metric.values.length - 1].value;
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	private findBucket(value: number): string {
		const metric = this.metrics.get(
			"agent_processing_duration_ms",
		) as HistogramMetric;
		for (const bucket of metric.buckets) {
			if (value <= bucket) {
				return bucket.toString();
			}
		}
		return "+Inf";
	}

	private formatLabels(labels: Record<string, string>): string {
		const labelStr = Object.entries(labels)
			.map(([k, v]) => `${k}="${v}"`)
			.join(",");
		return labelStr ? `,${labelStr}` : "";
	}

	private aggregateMetricValues(
		metric: CounterMetric | GaugeMetric,
	): Map<string, number> {
		const aggregated = new Map<string, number>();

		metric.values.forEach((v) => {
			const labelStr = this.formatLabelsForAggregation(v.labels);
			const key = labelStr ? `{${labelStr}}` : "";
			aggregated.set(key, (aggregated.get(key) || 0) + v.value);
		});

		return aggregated;
	}

	private formatLabelsForAggregation(labels: Record<string, string>): string {
		return Object.entries(labels)
			.map(([k, v]) => `${k}="${v}"`)
			.join(",");
	}
}

// ============================================================================
// DORA METRICS
// ============================================================================

/**
 * DoraMetrics interface.
 *
 * @example
 * ```ts
 * const value: DoraMetrics = {} as DoraMetrics;
 * console.log(value);
 * ```
 */
export interface DoraMetrics {
	deploymentFrequency: number; // deployments per day
	leadTimeForChanges: number; // minutes from commit to production
	meanTimeToRecovery: number; // minutes to recover from failure
	changeFailureRate: number; // percentage of deployments causing failures
}

/**
 * DoraMetricsCollector class.
 *
 * @example
 * ```ts
 * const value = new DoraMetricsCollector();
 * console.log(value);
 * ```
 */
export class DoraMetricsCollector {
	private deployments: Array<{
		timestamp: number;
		success: boolean;
		leadTimeMinutes: number;
	}> = [];
	private failures: Array<{ timestamp: number; recoveryTimeMinutes: number }> =
		[];

	recordDeployment(success: boolean, leadTimeMinutes: number): void {
		this.deployments.push({
			timestamp: Date.now(),
			success,
			leadTimeMinutes,
		});

		// Keep only last 90 days
		const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
		this.deployments = this.deployments.filter((d) => d.timestamp >= cutoff);
	}

	recordFailureRecovery(recoveryTimeMinutes: number): void {
		this.failures.push({
			timestamp: Date.now(),
			recoveryTimeMinutes,
		});

		// Keep only last 90 days
		const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
		this.failures = this.failures.filter((f) => f.timestamp >= cutoff);
	}

	getMetrics(): DoraMetrics {
		const now = Date.now();
		const dayWindow = 24 * 60 * 60 * 1000;
		const weekWindow = 7 * dayWindow;

		// Deployment frequency (per day, averaged over last week)
		const recentDeployments = this.deployments.filter(
			(d) => d.timestamp >= now - weekWindow,
		);
		const deploymentFrequency = recentDeployments.length / 7;

		// Lead time for changes (median of last week)
		const leadTimes = recentDeployments
			.map((d) => d.leadTimeMinutes)
			.sort((a, b) => a - b);
		const leadTimeForChanges =
			leadTimes.length > 0 ? leadTimes[Math.floor(leadTimes.length / 2)] : 0;

		// Mean time to recovery (average of last week)
		const recentFailures = this.failures.filter(
			(f) => f.timestamp >= now - weekWindow,
		);
		const meanTimeToRecovery =
			recentFailures.length > 0
				? recentFailures.reduce((sum, f) => sum + f.recoveryTimeMinutes, 0) /
					recentFailures.length
				: 0;

		// Change failure rate
		const successfulDeployments = recentDeployments.filter(
			(d) => d.success,
		).length;
		const changeFailureRate =
			recentDeployments.length > 0
				? ((recentDeployments.length - successfulDeployments) /
						recentDeployments.length) *
					100
				: 0;

		return {
			deploymentFrequency,
			leadTimeForChanges,
			meanTimeToRecovery,
			changeFailureRate,
		};
	}
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalMetricsCollector: AgentMetricsCollector | null = null;

/**
 * getAgentMetricsCollector operation.
 *
 * @returns Result of getAgentMetricsCollector.
 * @example
 * ```ts
 * const result = getAgentMetricsCollector();
 * console.log(result);
 * ```
 */
export function getAgentMetricsCollector(): AgentMetricsCollector {
	if (!globalMetricsCollector) {
		globalMetricsCollector = new AgentMetricsCollector();
	}
	return globalMetricsCollector;
}

let globalDoraMetricsCollector: DoraMetricsCollector | null = null;

/**
 * getDoraMetricsCollector operation.
 *
 * @returns Result of getDoraMetricsCollector.
 * @example
 * ```ts
 * const result = getDoraMetricsCollector();
 * console.log(result);
 * ```
 */
export function getDoraMetricsCollector(): DoraMetricsCollector {
	if (!globalDoraMetricsCollector) {
		globalDoraMetricsCollector = new DoraMetricsCollector();
	}
	return globalDoraMetricsCollector;
}
