/**
 * AI Gateway Module Types.
 *
 * Domain-agnostic types for the AI model provider abstraction layer.
 * These interfaces will be implemented in Phase 3 (PR #3).
 *
 * @module @arkelythex/platform-core/ai-gateway
 */

/**
 * Configuration for an AI model provider.
 */
export interface ProviderConfig {
	/** Provider identifier (e.g., "google", "anthropic", "openai") */
	name: string;
	/** Base URL for the provider API */
	baseUrl?: string;
	/** API key (resolved from environment at runtime) */
	apiKey?: string;
	/** Maximum retries on provider errors */
	maxRetries?: number;
}

/**
 * Configuration for a specific model.
 */
export interface ModelConfig {
	/** Model identifier (e.g., "gemini-3-flash", "claude-sonnet-4-5") */
	id: string;
	/** Provider that serves this model */
	provider: string;
	/** Model tier for cost and capability classification */
	tier: "flash" | "reasoning" | "opus";
	/** Cost per 1M input tokens in USD */
	costPer1MInput: number;
	/** Cost per 1M output tokens in USD */
	costPer1MOutput: number;
	/** Maximum context window in tokens */
	contextWindow: number;
}

/**
 * Configuration for the AI gateway.
 */
export interface GatewayConfig {
	/** Default provider for text generation */
	preferredProvider: string;
	/** Fallback provider if primary fails */
	fallbackProvider?: string;
	/** Whether to allow cross-provider fallback */
	allowCrossProvider?: boolean;
	/** Maximum cost per request in USD (null = unlimited) */
	maxCostPerRequest?: number | null;
}
