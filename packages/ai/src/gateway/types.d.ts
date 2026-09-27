export declare const LLM_PROVIDER: {
    readonly ANTHROPIC: "anthropic";
    readonly OPENAI: "openai";
    readonly GOOGLE: "google";
    readonly GROK: "grok";
    readonly OPENROUTER: "openrouter";
    readonly OLLAMA: "ollama";
    readonly DEEPSEEK: "deepseek";
};
export type LLMProvider = (typeof LLM_PROVIDER)[keyof typeof LLM_PROVIDER];
export declare const REQUEST_PRIORITY: {
    readonly LOW: "low";
    readonly NORMAL: "normal";
    readonly HIGH: "high";
};
export type RequestPriority = (typeof REQUEST_PRIORITY)[keyof typeof REQUEST_PRIORITY];
export declare const MESSAGE_ROLE: {
    readonly SYSTEM: "system";
    readonly USER: "user";
    readonly ASSISTANT: "assistant";
    readonly TOOL: "tool";
};
export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];
export interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
}
export interface ChatTool {
    type: "function";
    function: {
        name: string;
        description?: string;
        parameters: Record<string, unknown>;
    };
}
export interface ChatToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}
export interface ChatToolMessage {
    role: "tool";
    content: string;
    toolCallId: string;
}
export interface ChatCompletionRequest {
    model: string;
    provider?: LLMProvider;
    messages: ChatMessage[];
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    stop?: string | string[];
    seed?: number;
    stream?: boolean;
    tools?: ChatTool[];
    toolChoice?: "none" | "auto" | {
        type: "function";
        function: {
            name: string;
        };
    };
    responseFormat?: {
        type: "json_object";
    };
    priority?: RequestPriority;
    metadata?: Record<string, unknown>;
}
export interface AuthenticatedChatRequest extends ChatCompletionRequest {
    organizationId: number;
    userId: string;
}
export interface ChatCompletionUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface ChatCompletionChoice {
    index: number;
    message: ChatMessage;
    finishReason?: "stop" | "length" | "content_filter" | "tool_calls" | null;
}
export interface ChatCompletionResponse {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    provider: LLMProvider;
    choices: ChatCompletionChoice[];
    usage: ChatCompletionUsage;
}
export interface ChatCompletionStreamChunk {
    id: string;
    object: "chat.completion.chunk";
    created: number;
    model: string;
    provider: LLMProvider;
    choices: Array<{
        index: number;
        delta: Partial<ChatMessage>;
        finishReason?: "stop" | "length" | "content_filter" | "tool_calls" | null;
    }>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface ProviderCredentials {
    id: number;
    organizationId: number;
    provider: LLMProvider;
    encryptedApiKey: string;
    apiKeyAlias?: string;
    isActive: boolean;
    isDefault: boolean;
    rateLimitRpm: number;
    rateLimitRpd: number;
    requestsToday: number;
    lastRequestAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface DecryptedCredential {
    provider: LLMProvider;
    apiKey: string;
    baseUrl?: string;
}
export interface OllamaConfig {
    baseUrl: string;
    defaultModel: string;
    apiKey?: string;
}
export interface OllamaModelList {
    models: Array<{
        name: string;
        modified_at: string;
        size: number;
    }>;
}
export interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerDay: number;
}
export interface RateLimitStatus {
    allowed: boolean;
    remainingRpm: number;
    resetRpmAt: Date;
    remainingRpd: number;
    resetRpdAt: Date;
    retryAfter?: number;
}
export interface RateLimitCheck {
    allowed: boolean;
    currentRpm: number;
    currentRpd: number;
    windowRpmResetsAt: Date;
    windowRpdResetsAt: Date;
}
export declare const LLM_ERROR_CODE: {
    readonly INVALID_API_KEY: "INVALID_API_KEY";
    readonly API_KEY_EXPIRED: "API_KEY_EXPIRED";
    readonly INSUFFICIENT_QUOTA: "INSUFFICIENT_QUOTA";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED";
    readonly PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE";
    readonly PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT";
    readonly PROVIDER_ERROR: "PROVIDER_ERROR";
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly CONTENT_FILTERED: "CONTENT_FILTERED";
    readonly GATEWAY_ERROR: "GATEWAY_ERROR";
    readonly NO_PROVIDERS_AVAILABLE: "NO_PROVIDERS_AVAILABLE";
    readonly INVALID_MODEL: "INVALID_MODEL";
    readonly BUDGET_EXCEEDED: "BUDGET_EXCEEDED";
};
export type LLMErrorCode = (typeof LLM_ERROR_CODE)[keyof typeof LLM_ERROR_CODE];
export declare class LLMGatewayError extends Error {
    readonly code: LLMErrorCode;
    readonly provider?: LLMProvider | undefined;
    readonly statusCode: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: LLMErrorCode, provider?: LLMProvider | undefined, statusCode?: number, details?: Record<string, unknown> | undefined);
}
export interface ProviderFallbackConfig {
    primary: LLMProvider;
    fallbacks: LLMProvider[];
    maxRetries: number;
    retryDelayMs: number;
}
export interface FailoverAttempt {
    provider: LLMProvider;
    success: boolean;
    error?: LLMGatewayError;
    latencyMs: number;
}
export interface RequestMetrics {
    requestId: string;
    organizationId: number;
    provider: LLMProvider;
    model: string;
    success: boolean;
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    errorCode?: LLMErrorCode;
}
//# sourceMappingURL=types.d.ts.map