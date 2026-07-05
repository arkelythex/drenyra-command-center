import type {
	CounterMetric,
	GaugeMetric,
	HistogramMetric,
	HistogramMetricValue,
	Metric,
	MetricValue,
} from "./types";

export class AgentMetricsCollector {
	private metrics: Map<string, Metric> = new Map();
	private readonly defaultBuckets = [
		10, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
	];

	constructor() {
		this.initializeMetrics();
	}

	private initializeMetrics(): void {
		this.metrics.set("agent_processing_duration_ms", {
			name: "agent_processing_duration_ms",
			help: "Time spent processing by agent in milliseconds",
			type: "histogram",
			buckets: this.defaultBuckets,
			values: [],
		});

		this.metrics.set("agent_processing_success_total", {
			name: "agent_processing_success_total",
			help: "Total number of successful agent executions",
			type: "counter",
			values: [],
		});

		this.metrics.set("agent_processing_failures_total", {
			name: "agent_processing_failures_total",
			help: "Total number of failed agent executions",
			type: "counter",
			values: [],
		});

		this.metrics.set("agent_active_count", {
			name: "agent_active_count",
			help: "Number of currently active agents",
			type: "gauge",
			values: [],
		});

		this.metrics.set("agent_retries_total", {
			name: "agent_retries_total",
			help: "Total number of agent retries",
			type: "counter",
			values: [],
		});

		this.metrics.set("agent_conflicts_detected_total", {
			name: "agent_conflicts_detected_total",
			help: "Total number of conflicts detected between agents",
			type: "counter",
			values: [],
		});

		this.metrics.set("agent_api_cost_usd", {
			name: "agent_api_cost_usd",
			help: "Total API cost in USD per agent",
			type: "counter",
			values: [],
		});

		this.metrics.set("agent_circuit_breaker_opens_total", {
			name: "agent_circuit_breaker_opens_total",
			help: "Total number of times circuit breaker opened",
			type: "counter",
			values: [],
		});
	}

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

		if (metric.values.length > 1000) {
			metric.values = metric.values.slice(-1000);
		}
	}

	recordSuccess(agentName: string): void {
		const metric = this.metrics.get(
			"agent_processing_success_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName },
		});
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	recordFailure(agentName: string, errorType: string): void {
		const metric = this.metrics.get(
			"agent_processing_failures_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName, error_type: errorType },
		});
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	setActiveAgents(count: number): void {
		const metric = this.metrics.get("agent_active_count") as GaugeMetric;
		metric.values.push({
			value: count,
			timestamp: Date.now(),
			labels: {},
		});
		if (metric.values.length > 1000) {
			metric.values = metric.values.slice(-1000);
		}
	}

	recordRetry(agentName: string): void {
		const metric = this.metrics.get("agent_retries_total") as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName },
		});
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	recordConflict(agentNames: string[]): void {
		const metric = this.metrics.get(
			"agent_conflicts_detected_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agents: agentNames.join(",") },
		});
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	recordApiCost(agentName: string, costUsd: number, model: string): void {
		const metric = this.metrics.get("agent_api_cost_usd") as CounterMetric;
		metric.values.push({
			value: costUsd,
			timestamp: Date.now(),
			labels: { agent: agentName, model },
		});
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

	recordCircuitBreakerOpen(agentName: string): void {
		const metric = this.metrics.get(
			"agent_circuit_breaker_opens_total",
		) as CounterMetric;
		metric.values.push({
			value: 1,
			timestamp: Date.now(),
			labels: { agent: agentName },
		});
		if (metric.values.length > 10000) {
			metric.values = metric.values.slice(-10000);
		}
	}

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

	getTotalApiCost(timeWindowMs?: number): number {
		const metric = this.metrics.get("agent_api_cost_usd") as CounterMetric;
		let values = metric.values;

		if (timeWindowMs) {
			const cutoff = Date.now() - timeWindowMs;
			values = values.filter((v) => v.timestamp >= cutoff);
		}

		return values.reduce((sum, v) => sum + v.value, 0);
	}

	getPrometheusMetrics(): string {
		const lines: string[] = [];

		this.metrics.forEach((metric) => {
			lines.push(`# HELP ${metric.name} ${metric.help}`);
			lines.push(`# TYPE ${metric.name} ${metric.type}`);

			if (metric.type === "histogram") {
				const buckets = new Map<string, number>();
				metric.values.forEach((v: HistogramMetricValue) => {
					const key = `${metric.name}_bucket{le="${v.bucket}"${this.formatLabels(v.labels)}}`;
					buckets.set(key, (buckets.get(key) || 0) + 1);
				});

				buckets.forEach((count, key) => {
					lines.push(`${key} ${count}`);
				});

				const sum = metric.values.reduce(
					(acc: number, v: HistogramMetricValue) => acc + v.value,
					0,
				);
				lines.push(`${metric.name}_sum ${sum}`);
				lines.push(`${metric.name}_count ${metric.values.length}`);
			} else {
				const aggregated = this.aggregateMetricValues(metric);
				aggregated.forEach((value, labels) => {
					lines.push(`${metric.name}${labels} ${value}`);
				});
			}

			lines.push("");
		});

		return lines.join("\n");
	}

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

	getActiveAgentsCount(): number {
		const metric = this.metrics.get("agent_active_count") as GaugeMetric;
		if (metric.values.length === 0) return 0;
		return metric.values[metric.values.length - 1].value;
	}

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
