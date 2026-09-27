export declare class AgentError extends Error {
    readonly type: "TRANSIENT" | "PERMANENT" | "UNKNOWN";
    readonly agentName: string;
    readonly recoverable: boolean;
    readonly retryable: boolean;
    readonly details: Record<string, unknown>;
    constructor(opts: {
        message: string;
        type: "TRANSIENT" | "PERMANENT" | "UNKNOWN";
        agentName: string;
        details?: Record<string, unknown>;
    });
}
export declare class TimeoutError extends AgentError {
    readonly type: "TRANSIENT";
    constructor(opts: {
        message?: string;
        agentName: string;
        details?: Record<string, unknown>;
    });
}
export declare class RateLimitError extends AgentError {
    readonly type: "TRANSIENT";
    readonly retryAfter?: number;
    constructor(opts: {
        message?: string;
        agentName: string;
        retryAfter?: number;
        details?: Record<string, unknown>;
    });
}
export declare class NetworkError extends AgentError {
    readonly type: "TRANSIENT";
    constructor(opts: {
        message?: string;
        agentName: string;
        details?: Record<string, unknown>;
    });
}
export declare class ProviderError extends AgentError {
    readonly type: "TRANSIENT";
    readonly provider: string;
    readonly statusCode?: number;
    constructor(opts: {
        message?: string;
        agentName: string;
        provider: string;
        statusCode?: number;
        details?: Record<string, unknown>;
    });
}
export declare class ValidationError extends AgentError {
    readonly type: "PERMANENT";
    constructor(opts: {
        message?: string;
        agentName: string;
        details?: Record<string, unknown>;
    });
}
export declare class InvalidInputError extends AgentError {
    readonly type: "PERMANENT";
    constructor(opts: {
        message?: string;
        agentName: string;
        details?: Record<string, unknown>;
    });
}
export declare class FiscalViolationError extends AgentError {
    readonly type: "PERMANENT";
    constructor(opts: {
        message?: string;
        agentName: string;
        details?: Record<string, unknown>;
    });
}
export declare function classifyError(err: unknown, agentName: string): AgentError;
//# sourceMappingURL=agent-error.d.ts.map