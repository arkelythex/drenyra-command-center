import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DbTransaction } from "../unit-of-work";
export type TxClient = DbTransaction | PostgresJsDatabase;
export type OwnershipToken = string;
export declare class IdempotencyStateError extends Error {
    readonly expectedState: string;
    readonly actualState: string;
    readonly recordId: string;
    constructor(message: string, expectedState: string, actualState: string, recordId: string);
}
export declare class IdempotencyOwnershipLostError extends Error {
    readonly recordId: string;
    readonly operation: string;
    constructor(recordId: string, operation: string);
}
export declare const DEFAULT_TTL_MS: number;
export declare const FISCAL_TTL_MS: number;
export interface AcquireInput {
    organizationId: string;
    companyId: string;
    operation: string;
    idempotencyKey: string;
    requestHash: string;
    ttlMs?: number;
}
export interface MarkCompletedInput {
    recordId: string;
    ownershipToken: OwnershipToken;
    responseStatus: number;
    responseBody: unknown;
    responseHeaders: Record<string, string>;
}
export interface MarkFailedInput {
    recordId: string;
    ownershipToken: OwnershipToken;
    failureCode: string;
    failureClass: "RETRYABLE" | "TERMINAL";
}
export type AcquireDecision = {
    kind: "acquired";
    recordId: string;
    ownershipToken: OwnershipToken;
    attemptCount: number;
} | {
    kind: "completed";
    recordId: string;
    responseStatus: number;
    responseBody: unknown;
} | {
    kind: "in-progress";
    recordId: string;
} | {
    kind: "terminal-failure";
    recordId: string;
    failureCode: string;
} | {
    kind: "payload-mismatch";
    recordId: string;
};
export interface IdempotencyRepository {
    acquire(tx: TxClient, input: AcquireInput, processingTimeoutMs: number): Promise<AcquireDecision>;
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
}
//# sourceMappingURL=idempotency.types.d.ts.map