/**
 * PrometheusJobExecutionMetrics — Adaptador Prometheus real para métricas de jobs.
 *
 * Conecta JobExecutionMetrics a counters Prometheus.
 * Labels de baja cardinalidad únicamente.
 *
 * Uso:
 *   const metrics = new PrometheusJobExecutionMetrics(register);
 *   metrics.outboxPublished({ queueName: "sunat", jobType: "submit" });
 */

import type {
	JobExecutionMetrics,
	JobMetricLabels,
	RepairMetricLabels,
} from "@drenyra/persistence/metrics";

// ─── Tipos Prometheus inline (sin dependencia pesada) ──────────────────────

/** Interfaz mínima de un registro Prometheus */
export interface PrometheusRegister {
	counter: (config: { name: string; help: string; labelNames?: string[] }) => {
		inc: (labels?: Record<string, string | number>) => void;
	};
	gauge: (config: { name: string; help: string; labelNames?: string[] }) => {
		set: (value: number, labels?: Record<string, string | number>) => void;
	};
}

function labelsToStrings(
	labels: JobMetricLabels,
): Record<string, string | number> {
	const result: Record<string, string | number> = {};
	if (labels.queueName) result.queue_name = labels.queueName;
	if (labels.jobType) result.job_type = labels.jobType;
	if (labels.uniquenessPolicy)
		result.uniqueness_policy = labels.uniquenessPolicy;
	if (labels.status) result.status = labels.status;
	if (labels.failureClass) result.failure_class = labels.failureClass;
	if (labels.errorCode) result.error_code = labels.errorCode;
	if ("repairType" in labels && (labels as RepairMetricLabels).repairType) {
		result.repair_type = (labels as RepairMetricLabels).repairType;
	}
	return result;
}

// ─── Adapter ───────────────────────────────────────────────────────────────

export class PrometheusJobExecutionMetrics implements JobExecutionMetrics {
	private readonly counters: Record<
		string,
		ReturnType<PrometheusRegister["counter"]>
	> = {};

	constructor(private readonly register: PrometheusRegister) {
		this.ensureCounter(
			"job_outbox_published_total",
			"Outbox events published to BullMQ",
			["queue_name", "job_type"],
		);
		this.ensureCounter(
			"job_outbox_publish_failures_total",
			"Outbox publish failures",
			["queue_name", "job_type"],
		);
		this.ensureCounter(
			"job_outbox_claim_expired_total",
			"Outbox claims that expired before publication",
			["queue_name", "job_type"],
		);
		this.ensureCounter(
			"job_execution_lease_expired_total",
			"Worker leases that expired (recovery needed)",
			["queue_name", "job_type"],
		);
		this.ensureCounter(
			"job_recovery_total",
			"Executions recovered by recovery sweep",
			["queue_name", "job_type"],
		);
		this.ensureCounter(
			"job_reconciliation_repairs_total",
			"Divergences repaired by reconciliation",
			["repair_type"],
		);
		this.ensureCounter(
			"job_execution_terminal_failures_total",
			"Executions failed with TERMINAL class",
			["queue_name", "job_type", "failure_class"],
		);
		this.ensureCounter(
			"job_execution_superseded_total",
			"Executions superseded (REPLACEABLE)",
			["queue_name", "job_type"],
		);
		this.ensureCounter(
			"job_execution_unknown_total",
			"Executions that entered UNKNOWN state",
			["queue_name", "job_type"],
		);
	}

	outboxPublished(labels: JobMetricLabels): void {
		this.counters.job_outbox_published_total.inc(labelsToStrings(labels));
	}

	outboxPublishFailed(labels: JobMetricLabels): void {
		this.counters.job_outbox_publish_failures_total.inc(
			labelsToStrings(labels),
		);
	}

	outboxClaimExpired(labels: JobMetricLabels): void {
		this.counters.job_outbox_claim_expired_total.inc(labelsToStrings(labels));
	}

	leaseExpired(labels: JobMetricLabels): void {
		this.counters.job_execution_lease_expired_total.inc(
			labelsToStrings(labels),
		);
	}

	recoveryPerformed(labels: JobMetricLabels): void {
		this.counters.job_recovery_total.inc(labelsToStrings(labels));
	}

	reconciliationRepair(labels: RepairMetricLabels): void {
		this.counters.job_reconciliation_repairs_total.inc(labelsToStrings(labels));
	}

	executionUnknown(labels: JobMetricLabels): void {
		this.counters.job_execution_unknown_total.inc(labelsToStrings(labels));
	}

	executionTerminalFailure(labels: JobMetricLabels): void {
		this.counters.job_execution_terminal_failures_total.inc({
			...labelsToStrings(labels),
			failure_class: labels.failureClass ?? "TERMINAL",
		});
	}

	executionSuperseded(labels: JobMetricLabels): void {
		this.counters.job_execution_superseded_total.inc(labelsToStrings(labels));
	}

	// ─── Helpers ───────────────────────────────────────────────────────

	private ensureCounter(
		name: string,
		help: string,
		labelNames: string[],
	): void {
		this.counters[name] = this.register.counter({ name, help, labelNames });
	}
}
