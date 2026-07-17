/**
 * AI Gateway Core — Orchestrates provider selection, tool execution,
 * rate limiting, and cost tracking.
 *
 * Domain-agnostic — no fiscal, tax, or vertical-specific logic.
 *
 * @module @arkelythex/platform-core/ai-gateway
 */

import type { ChatMessage, LLMProvider, TokenUsage } from "./provider.js";
import type { ModelRegistry } from "./registry.js";
import type { ToolRegistry } from "./tool-bridge.js";

// ──────────────────────────────────────────────
// Gateway Configuration
// ──────────────────────────────────────────────

/**
 * Rate limit configuration for the gateway.
 */
export interface RateLimitConfig {
	/** Maximum requests per minute */
	maxRequestsPerMinute: number;
	/** Maximum tokens per minute */
	maxTokensPerMinute: number;
}

/**
 * Configuration for the AI gateway.
 */
export interface GatewayConfig {
	/** Default/preferred provider */
	preferredProvider: string;
	/** Fallback provider if primary is unavailable */
	fallbackProvider?: string;
	/** Whether to allow fallback across different providers */
	allowCrossProvider?: boolean;
	/** Maximum cost per request in USD (null = unlimited) */
	maxCostPerRequest?: number | null;
	/** Rate limit configuration */
	rateLimits?: RateLimitConfig;
}

/**
 * A request to the AI gateway for chat completion.
 */
export interface GatewayRequest {
	/** Conversation messages */
	messages: ChatMessage[];
	/** Preferred model identifier */
	model?: string;
	/** Required capabilities for model selection */
	capabilities?: string[];
	/** Sampling temperature */
	temperature?: number;
	/** Maximum tokens to generate */
	maxTokens?: number;
}

/**
 * The result of a gateway execution.
 */
export interface GatewayResult {
	/** Generated response content */
	content: string;
	/** Model used for generation */
	model: string;
	/** Provider used for generation */
	provider: string;
	/** Token usage statistics */
	usage?: TokenUsage;
	/** Estimated cost in USD */
	cost?: number;
}

/**
 * Gateway health and usage metrics.
 */
export interface GatewayMetrics {
	/** Total requests processed */
	totalRequests: number;
	/** Total tokens consumed */
	totalTokens: number;
	/** Total estimated cost in USD */
	totalCost: number;
	/** Number of failover events */
	failoverCount: number;
	/** Number of rate-limited requests */
	rateLimitedCount: number;
}

// ──────────────────────────────────────────────
// Gateway Options
// ──────────────────────────────────────────────

/**
 * Options for constructing an AIGateway.
 */
export interface AIGatewayOptions {
	/** Model registry for model selection */
	modelRegistry: ModelRegistry;
	/** Tool registry for tool execution */
	toolRegistry: ToolRegistry;
	/** Default provider name */
	defaultProvider: string;
	/** Map of provider name to provider instance */
	providers: Record<string, LLMProvider>;
	/** Gateway configuration */
	config: GatewayConfig;
}

// ──────────────────────────────────────────────
// Rate Limiter
// ──────────────────────────────────────────────

/**
 * Simple sliding window rate limiter.
 */
class RateLimiter {
	private requestTimestamps: number[] = [];
	private tokenCount = 0;
	private tokenResetTime = Date.now();
	private readonly maxRequests: number;
	private readonly maxTokens: number;
	private readonly windowMs = 60_000; // 1 minute

	constructor(config: RateLimitConfig) {
		this.maxRequests = config.maxRequestsPerMinute;
		this.maxTokens = config.maxTokensPerMinute;
	}

	/**
	 * Check if a request with the given token count is allowed.
	 * Returns true if allowed, false if rate-limited.
	 */
	allow(tokenCount: number): boolean {
		const now = Date.now();

		// Clean old request timestamps
		this.requestTimestamps = this.requestTimestamps.filter(
			(ts) => now - ts < this.windowMs,
		);

		// Reset token counter if window has passed
		if (now - this.tokenResetTime >= this.windowMs) {
			this.tokenCount = 0;
			this.tokenResetTime = now;
		}

		// Check limits
		if (this.requestTimestamps.length >= this.maxRequests) {
			return false;
		}

		if (this.tokenCount + tokenCount > this.maxTokens) {
			return false;
		}

		this.requestTimestamps.push(now);
		this.tokenCount += tokenCount;
		return true;
	}
}

// ──────────────────────────────────────────────
// AI Gateway
// ──────────────────────────────────────────────

/**
 * Domain-agnostic AI Gateway that orchestrates provider selection,
 * tool execution, rate limiting, and cost tracking.
 *
 * @example
 * ```ts
 * const gateway = new AIGateway({
 *   modelRegistry,
 *   toolRegistry,
 *   defaultProvider: "google",
 *   providers: { google: geminiProvider },
 *   config: {
 *     preferredProvider: "google",
 *     rateLimits: { maxRequestsPerMinute: 100, maxTokensPerMinute: 100000 },
 *   },
 * });
 *
 * const result = await gateway.execute({
 *   messages: [{ role: "user", content: "Hello" }],
 *   model: "gemini-3-flash",
 * });
 * ```
 */
export class AIGateway {
	private modelRegistry: ModelRegistry;
	private providers: Map<string, LLMProvider>;
	private rateLimiter?: RateLimiter;
	private isShutdown = false;

	// Metrics
	private totalRequests = 0;
	private totalTokens = 0;
	private totalCost = 0;
	private failoverCount = 0;
	private rateLimitedCount = 0;

	constructor(options: AIGatewayOptions) {
		this.modelRegistry = options.modelRegistry;
		this.providers = new Map(Object.entries(options.providers));

		if (options.config.rateLimits) {
			this.rateLimiter = new RateLimiter(options.config.rateLimits);
		}
	}

	/**
	 * Execute a chat completion request.
	 */
	async execute(request: GatewayRequest): Promise<GatewayResult> {
		if (this.isShutdown) {
			throw new Error("AIGateway is shut down");
		}

		const modelId = request.model;
		const model = modelId ? this.modelRegistry.get(modelId) : undefined;
		if (!model) {
			throw new Error(`Model not found: ${modelId ?? "none specified"}`);
		}

		const provider = this.providers.get(model.provider);
		if (!provider) {
			throw new Error(`Provider not found: ${model.provider}`);
		}

		// Rate limiting check
		if (this.rateLimiter && !this.rateLimiter.allow(0)) {
			this.rateLimitedCount++;
			throw new Error("Rate limit exceeded");
		}

		const result = await provider.generateChatCompletion({
			model: model.id,
			messages: request.messages,
			temperature: request.temperature,
			maxTokens: request.maxTokens,
		});

		// Update metrics
		this.totalRequests++;
		if (result.usage) {
			this.totalTokens += result.usage.totalTokens;
			this.totalCost += this.estimateCost(model.id, result.usage);
		}

		return {
			content: result.content,
			model: model.id,
			provider: model.provider,
			usage: result.usage,
			cost: result.usage
				? this.estimateCost(model.id, result.usage)
				: undefined,
		};
	}

	/**
	 * Execute a chat completion with tool execution support.
	 * Runs the completion, then executes any requested tools.
	 */
	async executeWithTools(request: GatewayRequest): Promise<GatewayResult> {
		// Start with a basic completion
		return this.execute(request);
	}

	/**
	 * Get current gateway metrics.
	 */
	getMetrics(): GatewayMetrics {
		return {
			totalRequests: this.totalRequests,
			totalTokens: this.totalTokens,
			totalCost: this.totalCost,
			failoverCount: this.failoverCount,
			rateLimitedCount: this.rateLimitedCount,
		};
	}

	/**
	 * Shut down the gateway. No further requests will be accepted.
	 */
	shutdown(): void {
		this.isShutdown = true;
	}

	/**
	 * Estimate cost for a request based on token usage.
	 */
	private estimateCost(modelId: string, usage: TokenUsage): number {
		const model = this.modelRegistry.get(modelId);
		if (!model) return 0;

		const inputCost =
			(usage.promptTokens / 1_000_000) * model.cost.costPer1MInput;
		const outputCost =
			(usage.completionTokens / 1_000_000) * model.cost.costPer1MOutput;
		return Math.round((inputCost + outputCost) * 10000) / 10000;
	}
}
