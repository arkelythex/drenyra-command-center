export class SessionStoreError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "SessionStoreError";
    }
}
export class SessionNotFoundError extends SessionStoreError {
    constructor(runId) {
        super(`Run state not found: ${runId}`);
        this.name = "SessionNotFoundError";
    }
}
//# sourceMappingURL=session.types.js.map