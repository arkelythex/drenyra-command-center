import type { AcquireDecision, AcquireInput, IdempotencyRepository, MarkCompletedInput, MarkFailedInput, TxClient } from "./idempotency.types";
declare const DEFAULT_PROCESSING_TIMEOUT_MS = 30000;
export declare class PostgresIdempotencyRepository implements IdempotencyRepository {
    acquire(tx: TxClient, input: AcquireInput, processingTimeoutMs?: number): Promise<AcquireDecision>;
    markCompleted(tx: TxClient, input: MarkCompletedInput): Promise<void>;
    markFailed(tx: TxClient, input: MarkFailedInput): Promise<void>;
    findByScopeAndKey(tx: TxClient, input: AcquireInput): Promise<{
        id: string;
        status: string;
        requestHash: string;
        responseStatus: number | null;
        responseBody: unknown;
        failureClass: string | null;
        lockedAt: Date | null;
    } | null>;
    private tryInsertPending;
    private selectByScope;
    private routeByStatus;
    private handleProcessing;
    private handleFailed;
    private handlePending;
    private throwOwnershipOrStateError;
}
export { DEFAULT_PROCESSING_TIMEOUT_MS };
//# sourceMappingURL=postgres-idempotency.repository.d.ts.map