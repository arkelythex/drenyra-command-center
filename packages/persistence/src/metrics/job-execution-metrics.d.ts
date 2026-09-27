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
export interface JobExecutionMetrics {
    outboxPublished(labels: JobMetricLabels): void;
    outboxPublishFailed(labels: JobMetricLabels): void;
    outboxClaimExpired(labels: JobMetricLabels): void;
    leaseExpired(labels: JobMetricLabels): void;
    recoveryPerformed(labels: JobMetricLabels): void;
    reconciliationRepair(labels: RepairMetricLabels): void;
    executionUnknown(labels: JobMetricLabels): void;
    executionTerminalFailure(labels: JobMetricLabels): void;
    executionSuperseded(labels: JobMetricLabels): void;
}
export declare class NoopJobExecutionMetrics implements JobExecutionMetrics {
    outboxPublished(): void;
    outboxPublishFailed(): void;
    outboxClaimExpired(): void;
    leaseExpired(): void;
    recoveryPerformed(): void;
    reconciliationRepair(): void;
    executionUnknown(): void;
    executionTerminalFailure(): void;
    executionSuperseded(): void;
}
//# sourceMappingURL=job-execution-metrics.d.ts.map