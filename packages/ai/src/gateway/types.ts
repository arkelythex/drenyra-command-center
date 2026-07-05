/**
 * Multi-Provider LLM Gateway - TypeScript Types
 *
 * Provides type-safe interfaces for the unified LLM gateway that routes
 * requests to multiple providers (Anthropic, OpenAI, Google, Grok, OpenRouter).
 *
 * @module @drenyra/ai/gateway
 */

// ============================================
// Enums (const pattern - REQUIRED)
// ============================================

/**
 * Supported LLM providers.
 */
export const LLM_PROVIDER = {
	ANTHROPIC: "anthropic",
	OPENAI: "openai",
	GOOGLE: "google",
	GROK: "grok",
	OPENROUTER: "openrouter",
	OLLAMA: "ollama",
	DEEPSEEK: "deepseek",
} as const;

export type LLMProvider = (typeof LLM_PROVIDER)[keyof typeof LLM_PROVIDER];

/**
 * Request priority levels for rate limiting.
 */
export const REQUEST_PRIORITY = {
	LOW: "low",
	NORMAL: "normal",
	HIGH: "high",
} as const;

export type RequestPriority =
	(typeof REQUEST_PRIORITY)[keyof typeof REQUEST_PRIORITY];

// ============================================
// Chat Completion Types (OpenAI-compatible)
// ============================================

/**
 * Message role in a conversation.
 */
export const MESSAGE_ROLE = {
	SYSTEM: "system",
	USER: "user",
	ASSISTANT: "assistant",
	TOOL: "tool",
} as const;

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];

/**
 * A single message in a conversation.
 */
export interface ChatMessage {
	role: MessageRole;
	content: string;
	name?: string;
	toolCallId?: string;
}

/**
 * Tool/function definition for function calling.
 */
export interface ChatTool {
	type: "function";
	function: {
		name: string;
		description?: string;
		parameters: Record<string, unknown>; // JSON Schema
	};
}

/**
 * Tool call request from the model.
 */
export interface ChatToolCall {
	id: string;
	type: "function";
	function: {
		name: string;
		arguments: string; // JSON string
	};
}

/**
 * Tool call result from the client.
 */
export interface ChatToolMessage {
	role: "tool";
	content: string;
	toolCallId: string;
}

// ============================================
// Request Types
// ============================================

/**
 * Unified chat completion request.
 * OpenAI-compatible format with provider override support.
 */
export interface ChatCompletionRequest {
	// Model specification
	model: string;
	provider?: LLMProvider; // Override default provider

	// Messages
	messages: ChatMessage[];

	// Optional parameters
	temperature?: number; // 0-2, default 1
	topP?: number; // 0-1
	maxTokens?: number;
	stop?: string | string[];
	seed?: number;

	// Streaming
	stream?: boolean;

	// Tools/Function calling
	tools?: ChatTool[];
	toolChoice?:
		| "none"
		| "auto"
		| { type: "function"; function: { name: string } };

	// Response format (JSON mode)
	responseFormat?: { type: "json_object" };

	// Gateway-specific
	priority?: RequestPriority;
	metadata?: Record<string, unknown>;
}

/**
 * Request with authentication context.
 */
export interface AuthenticatedChatRequest extends ChatCompletionRequest {
	organizationId: number;
	userId: string;
}

// ============================================
// Response Types
// ============================================

/**
 * Usage statistics for a completion.
 */
export interface ChatCompletionUsage {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
}

/**
 * A single completion choice (message).
 */
export interface ChatCompletionChoice {
	index: number;
	message: ChatMessage;
	finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
}

/**
 * Non-streaming chat completion response.
 */
export interface ChatCompletionResponse {
	id: string;
	object: "chat.completion";
	created: number;
	model: string;
	provider: LLMProvider;
	choices: ChatCompletionChoice[];
	usage: ChatCompletionUsage;
}

/**
 * Stream chunk for Server-Sent Events (SSE).
 */
export interface ChatCompletionStreamChunk {
	id: string;
	object: "chat.completion.chunk";
	created: number;
	model: string;
	provider: LLMProvider;
	choices: Array<{
		index: number;
		delta: Partial<ChatMessage>;
		finishReason: string | null;
	}>;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

// ============================================
// Provider Credential Types
// ============================================

/**
 * Stored credential configuration.
 */
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

/**
 * Decrypted credential for API calls.
 */
export interface DecryptedCredential {
	provider: LLMProvider;
	apiKey: string;
	baseUrl?: string; // For custom endpoints (e.g., OpenRouter)
}

/**
 * Ollama-specific configuration.
 */
export interface OllamaConfig {
	baseUrl: string;
	defaultModel: string;
	apiKey?: string;
}

/**
 * Response from Ollama /api/tags endpoint.
 */
export interface OllamaModelList {
	models: Array<{
		name: string;
		modified_at: string;
		size: number;
	}>;
}

// ============================================
// Rate Limiting Types
// ============================================

/**
 * Rate limit configuration.
 */
export interface RateLimitConfig {
	requestsPerMinute: number;
	requestsPerDay: number;
}

/**
 * Rate limit status for a user/provider.
 */
export interface RateLimitStatus {
	allowed: boolean;
	remainingRpm: number;
	resetRpmAt: Date;
	remainingRpd: number;
	resetRpdAt: Date;
	retryAfter?: number; // seconds to wait
}

/**
 * Rate limit check result.
 */
export interface RateLimitCheck {
	allowed: boolean;
	currentRpm: number;
	currentRpd: number;
	windowRpmResetsAt: Date;
	windowRpdResetsAt: Date;
}

// ============================================
// Error Types
// ============================================

/**
 * Provider-specific error codes.
 */
export const LLM_ERROR_CODE = {
	// Authentication
	INVALID_API_KEY: "INVALID_API_KEY",
	API_KEY_EXPIRED: "API_KEY_EXPIRED",
	INSUFFICIENT_QUOTA: "INSUFFICIENT_QUOTA",

	// Rate limiting
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
	DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",

	// Provider errors
	PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
	PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT",
	PROVIDER_ERROR: "PROVIDER_ERROR",
	BAD_REQUEST: "BAD_REQUEST",
	CONTENT_FILTERED: "CONTENT_FILTERED",

	// Gateway errors
	GATEWAY_ERROR: "GATEWAY_ERROR",
	NO_PROVIDERS_AVAILABLE: "NO_PROVIDERS_AVAILABLE",
	INVALID_MODEL: "INVALID_MODEL",

	// Budget enforcement
	BUDGET_EXCEEDED: "BUDGET_EXCEEDED",
} as const;

export type LLMErrorCode = (typeof LLM_ERROR_CODE)[keyof typeof LLM_ERROR_CODE];

/**
 * LLM Gateway error.
 */
export class LLMGatewayError extends Error {
	constructor(
		message: string,
		public readonly code: LLMErrorCode,
		public readonly provider?: LLMProvider,
		public readonly statusCode: number = 500,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "LLMGatewayError";
	}
}

// ============================================
// Failover Types
// ============================================

/**
 * Provider fallback configuration.
 */
export interface ProviderFallbackConfig {
	primary: LLMProvider;
	fallbacks: LLMProvider[];
	maxRetries: number;
	retryDelayMs: number;
}

/**
 * Failover attempt result.
 */
export interface FailoverAttempt {
	provider: LLMProvider;
	success: boolean;
	error?: LLMGatewayError;
	latencyMs: number;
}

// ============================================
// Metrics Types
// ============================================

/**
 * Request metrics for observability.
 */
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
