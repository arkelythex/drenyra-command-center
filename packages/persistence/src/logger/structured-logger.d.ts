export interface JobLogContext {
    executionId?: string;
    outboxId?: string;
    queueName?: string;
    jobType?: string;
    uniquenessPolicy?: string;
    status?: string;
    generation?: number;
    attemptCount?: number;
    organizationId?: string;
    companyId?: string;
    failureClass?: string;
    failureCode?: string;
    divergenceType?: string;
    repairType?: string;
    executionTokenHash?: string;
    relayTokenHash?: string;
    [key: string]: unknown;
}
export interface StructuredLogger {
    debug(event: string, context: JobLogContext): void;
    info(event: string, context: JobLogContext): void;
    warn(event: string, context: JobLogContext): void;
    error(event: string, context: JobLogContext & {
        error?: unknown;
    }): void;
}
export declare class NoopLogger implements StructuredLogger {
    debug(): void;
    info(): void;
    warn(): void;
    error(): void;
}
//# sourceMappingURL=structured-logger.d.ts.map