export const LLM_PROVIDER = {
    ANTHROPIC: "anthropic",
    OPENAI: "openai",
    GOOGLE: "google",
    GROK: "grok",
    OPENROUTER: "openrouter",
    OLLAMA: "ollama",
    DEEPSEEK: "deepseek",
};
export const REQUEST_PRIORITY = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
};
export const MESSAGE_ROLE = {
    SYSTEM: "system",
    USER: "user",
    ASSISTANT: "assistant",
    TOOL: "tool",
};
export const LLM_ERROR_CODE = {
    INVALID_API_KEY: "INVALID_API_KEY",
    API_KEY_EXPIRED: "API_KEY_EXPIRED",
    INSUFFICIENT_QUOTA: "INSUFFICIENT_QUOTA",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",
    PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
    PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT",
    PROVIDER_ERROR: "PROVIDER_ERROR",
    BAD_REQUEST: "BAD_REQUEST",
    CONTENT_FILTERED: "CONTENT_FILTERED",
    GATEWAY_ERROR: "GATEWAY_ERROR",
    NO_PROVIDERS_AVAILABLE: "NO_PROVIDERS_AVAILABLE",
    INVALID_MODEL: "INVALID_MODEL",
    BUDGET_EXCEEDED: "BUDGET_EXCEEDED",
};
export class LLMGatewayError extends Error {
    code;
    provider;
    statusCode;
    details;
    constructor(message, code, provider, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.statusCode = statusCode;
        this.details = details;
        this.name = "LLMGatewayError";
    }
}
//# sourceMappingURL=types.js.map