export class IdempotencyStateError extends Error {
    expectedState;
    actualState;
    recordId;
    constructor(message, expectedState, actualState, recordId) {
        super(message);
        this.expectedState = expectedState;
        this.actualState = actualState;
        this.recordId = recordId;
        this.name = "IdempotencyStateError";
    }
}
export class IdempotencyOwnershipLostError extends Error {
    recordId;
    operation;
    constructor(recordId, operation) {
        super(`Ownership lost for record ${recordId} during ${operation}: another worker has since acquired or completed this record`);
        this.recordId = recordId;
        this.operation = operation;
        this.name = "IdempotencyOwnershipLostError";
    }
}
export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
export const FISCAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
//# sourceMappingURL=idempotency.types.js.map