export class AgentError extends Error {
    type;
    agentName;
    recoverable;
    retryable;
    details;
    constructor(opts) {
        super(opts.message);
        this.name = "AgentError";
        this.type = opts.type;
        this.agentName = opts.agentName;
        this.details = opts.details ?? {};
        this.retryable = opts.type === "TRANSIENT" || opts.type === "UNKNOWN";
        this.recoverable = opts.type === "TRANSIENT" || opts.type === "UNKNOWN";
    }
}
export class TimeoutError extends AgentError {
    type = "TRANSIENT";
    constructor(opts) {
        super({
            message: opts.message ?? `Agent ${opts.agentName} timed out`,
            type: "TRANSIENT",
            agentName: opts.agentName,
            details: opts.details,
        });
        this.name = "TimeoutError";
    }
}
export class RateLimitError extends AgentError {
    type = "TRANSIENT";
    retryAfter;
    constructor(opts) {
        super({
            message: opts.message ?? `Rate limit exceeded for agent ${opts.agentName}`,
            type: "TRANSIENT",
            agentName: opts.agentName,
            details: { ...opts.details, retryAfter: opts.retryAfter },
        });
        this.name = "RateLimitError";
        this.retryAfter = opts.retryAfter;
    }
}
export class NetworkError extends AgentError {
    type = "TRANSIENT";
    constructor(opts) {
        super({
            message: opts.message ?? `Network error for agent ${opts.agentName}`,
            type: "TRANSIENT",
            agentName: opts.agentName,
            details: opts.details,
        });
        this.name = "NetworkError";
    }
}
export class ProviderError extends AgentError {
    type = "TRANSIENT";
    provider;
    statusCode;
    constructor(opts) {
        super({
            message: opts.message ??
                `Provider ${opts.provider} error for agent ${opts.agentName}`,
            type: "TRANSIENT",
            agentName: opts.agentName,
            details: {
                ...opts.details,
                provider: opts.provider,
                statusCode: opts.statusCode,
            },
        });
        this.name = "ProviderError";
        this.provider = opts.provider;
        this.statusCode = opts.statusCode;
    }
}
export class ValidationError extends AgentError {
    type = "PERMANENT";
    constructor(opts) {
        super({
            message: opts.message ?? `Validation failed for agent ${opts.agentName}`,
            type: "PERMANENT",
            agentName: opts.agentName,
            details: opts.details,
        });
        this.name = "ValidationError";
    }
}
export class InvalidInputError extends AgentError {
    type = "PERMANENT";
    constructor(opts) {
        super({
            message: opts.message ?? `Invalid input for agent ${opts.agentName}`,
            type: "PERMANENT",
            agentName: opts.agentName,
            details: opts.details,
        });
        this.name = "InvalidInputError";
    }
}
export class FiscalViolationError extends AgentError {
    type = "PERMANENT";
    constructor(opts) {
        super({
            message: opts.message ?? `Fiscal violation detected for agent ${opts.agentName}`,
            type: "PERMANENT",
            agentName: opts.agentName,
            details: opts.details,
        });
        this.name = "FiscalViolationError";
    }
}
export function classifyError(err, agentName) {
    const message = err instanceof Error
        ? err.message
        : err != null
            ? String(err)
            : "Unknown error";
    const lower = message.toLowerCase();
    const transientPatterns = [
        "timeout",
        "timed out",
        "network",
        "econnrefused",
        "econnreset",
        "econnaborted",
        "etimedout",
        "429",
        "500",
        "502",
        "503",
        "504",
        "rate limit",
        "too many requests",
        "service unavailable",
        "internal server error",
        "bad gateway",
        "gateway timeout",
    ];
    for (const pattern of transientPatterns) {
        if (lower.includes(pattern)) {
            if (pattern.includes("rate limit") ||
                pattern === "too many requests" ||
                pattern === "429") {
                return new RateLimitError({ message, agentName });
            }
            if (pattern.includes("timeout") ||
                pattern === "timed out" ||
                pattern === "etimedout") {
                return new TimeoutError({ message, agentName });
            }
            if (pattern.includes("network") ||
                pattern === "econnrefused" ||
                pattern === "econnreset" ||
                pattern === "econnaborted") {
                return new NetworkError({ message, agentName });
            }
            if (pattern === "502" || pattern === "503" || pattern === "504") {
                return new ProviderError({
                    message,
                    agentName,
                    provider: "unknown",
                    statusCode: parseInt(pattern, 10),
                });
            }
            return new NetworkError({ message, agentName });
        }
    }
    const permanentPatterns = [
        "validation",
        "invalid",
        "forbidden",
        "400",
        "403",
        "unauthorized",
        "not found",
        "bad request",
        "fiscal",
        "violation",
        "schema",
        "malformed",
    ];
    for (const pattern of permanentPatterns) {
        if (lower.includes(pattern)) {
            if (pattern === "validation" || pattern === "schema") {
                return new ValidationError({ message, agentName });
            }
            if (pattern === "invalid" ||
                pattern === "malformed" ||
                pattern === "bad request" ||
                pattern === "400") {
                return new InvalidInputError({ message, agentName });
            }
            if (pattern === "forbidden" ||
                pattern === "unauthorized" ||
                pattern === "403") {
                return new InvalidInputError({ message, agentName });
            }
            if (pattern === "fiscal" || pattern === "violation") {
                return new FiscalViolationError({ message, agentName });
            }
            return new ValidationError({ message, agentName });
        }
    }
    return new AgentError({
        message,
        type: "UNKNOWN",
        agentName,
    });
}
//# sourceMappingURL=agent-error.js.map