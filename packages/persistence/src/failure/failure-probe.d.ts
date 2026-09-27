export type FailureStage = "outbox.after-claim" | "outbox.before-queue-add" | "outbox.after-queue-add" | "outbox.before-pg-confirm" | "outbox.after-pg-confirm" | "runner.before-acquire" | "runner.after-acquire" | "runner.before-handler" | "runner.after-handler" | "runner.before-heartbeat" | "runner.after-heartbeat" | "runner.before-complete" | "runner.after-complete" | "runner.before-fail" | "runner.after-fail" | "recovery.before-claim" | "recovery.after-claim" | "recovery.before-transition" | "recovery.after-transition" | "reconciliation.after-detect" | "reconciliation.before-repair" | "reconciliation.after-repair";
export interface FailureContext {
    executionId?: string;
    outboxId?: string;
    relayToken?: string;
    relayTokenHash?: string;
    queueName?: string;
    jobType?: string;
    generation?: number;
    attemptCount?: number;
    component?: string;
    divergenceType?: string;
    repairType?: string;
    currentStatus?: string;
    uniquenessPolicy?: string;
    executionTokenHash?: string;
    [key: string]: unknown;
}
export interface FailureProbe {
    hit(stage: FailureStage, context?: FailureContext): Promise<void>;
}
export declare class NoopFailureProbe implements FailureProbe {
    hit(): Promise<void>;
}
//# sourceMappingURL=failure-probe.d.ts.map