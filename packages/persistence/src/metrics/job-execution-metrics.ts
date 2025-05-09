/**
 * JobExecutionMetrics — Puerto para métricas de jobs.
 *
 * Producción usa NoopJobExecutionMetrics (default).
 * Infraestructura implementa el adapter Prometheus.
 *
 * Labels de baja cardinalidad únicamente.
 * Nunca usar execution_id, organization_id, logical_key como labels.
 */

// ─── Labels ─────────────────────────────────────────────────────────────────

export interface JobMetricLabels {
	queueName?: string;
	jobType?: string;
	uniquenessPolicy?: string;
	status?: string;
	failureClass?: string;
	errorCode?: string;
}

export interface RepairMetricLabels extends JobMetricLabels {
	repairType: string;
}

// ─── Puerto ─────────────────────────────────────────────────────────────────

export interface JobExecutionMetrics {
	/** Outbox event published to BullMQ */
	outboxPublished(labels: JobMetricLabels): void;
	/** Outbox publish failed (queue.add error) */
	outboxPublishFailed(labels: JobMetricLabels): void;
	/** Outbox claim expired (relay lost ownership) */
	outboxClaimExpired(labels: JobMetricLabels): void;
	/** Worker lease expired (recovery needed) */
	leaseExpired(labels: JobMetricLabels): void;
	/** Recovery sweep performed a recovery */
	recoveryPerformed(labels: JobMetricLabels): void;
	/** Reconciliation repaired a divergence */
	reconciliationRepair(labels: RepairMetricLabels): void;
	/** Execution entered UNKNOWN state */
	executionUnknown(labels: JobMetricLabels): void;
	/** Execution failed with TERMINAL class */
	executionTerminalFailure(labels: JobMetricLabels): void;
	/** Execution was SUPERSEDED (REPLACEABLE) */
	executionSuperseded(labels: JobMetricLabels): void;
}

// ─── Noop (producción) ──────────────────────────────────────────────────────

export class NoopJobExecutionMetrics implements JobExecutionMetrics {
	outboxPublished() {}
	outboxPublishFailed() {}
	outboxClaimExpired() {}
	leaseExpired() {}
	recoveryPerformed() {}
	reconciliationRepair() {}
	executionUnknown() {}
	executionTerminalFailure() {}
	executionSuperseded() {}
}
