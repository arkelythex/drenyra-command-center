/**
 * OpenRouter Adapter
 * Gateway for accessing multiple LLMs (Grok, DeepSeek, Llama, etc.) via a unified API.
 * Enables the "Hybrid Strategy" for cost optimization and resilience.
 *
 * @see https://openrouter.ai/docs
 */

import { createHash } from "crypto";
import { loggers } from "../../logger";
import type { AIResponse } from "../types";

/**
 * OpenRouterConfig interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterConfig = {} as OpenRouterConfig;
 * console.log(value);
 * ```
 */
export interface OpenRouterConfig {
	apiKey: string;
	model?: string; // e.g., 'x-ai/grok-2-vision-1212', 'deepseek/deepseek-chat', 'meta-llama/llama-3-70b-instruct'
	maxTokens?: number;
	temperature?: number;
	cacheEnabled?: boolean;
	siteUrl?: string; // Required by OpenRouter for rankings
	siteName?: string; // Required by OpenRouter for rankings
}

/**
 * OpenRouterMessage interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterMessage = {} as OpenRouterMessage;
 * console.log(value);
 * ```
 */
export interface OpenRouterMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

/**
 * OpenRouterCompletionRequest interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterCompletionRequest = {} as OpenRouterCompletionRequest;
 * console.log(value);
 * ```
 */
export interface OpenRouterCompletionRequest {
	model: string;
	messages: OpenRouterMessage[];
	max_tokens?: number;
	temperature?: number;
	stream?: boolean;
	// OpenRouter specific optional parameters
	transforms?: string[];
	route?: "fallback";
}

/**
 * OpenRouterCompletionResponse interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterCompletionResponse = {} as OpenRouterCompletionResponse;
 * console.log(value);
 * ```
 */
export interface OpenRouterCompletionResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	// OpenRouter specific fields might appear here depending on response
}

/**
 * OpenRouterAdapter class.
 *
 * @example
 * ```ts
 * const value = new OpenRouterAdapter();
 * console.log(value);
 * ```
 */
export class OpenRouterAdapter {
	private config: Required<OpenRouterConfig>;
	private cache: Map<string, { content: string; timestamp: number }>;
	private readonly CACHE_TTL = 3600 * 1000; // 1 hour
	private readonly BASE_URL = "https://openrouter.ai/api/v1";

	constructor(config: OpenRouterConfig) {
		this.config = {
			apiKey: config.apiKey,
			model: config.model || "x-ai/grok-2-vision-1212", // Default to a strong model if not specified
			maxTokens: config.maxTokens || 4096,
			temperature: config.temperature || 0.1,
			cacheEnabled: config.cacheEnabled ?? true,
			siteUrl: config.siteUrl || "https://drenyrafounders.com", // Default or from env
			siteName: config.siteName || "Drenyra AI Swarm", // Default or from env
		};

		this.cache = new Map();

		if (!this.config.apiKey) {
			loggers.ai.warn("OpenRouterAdapter initialized without API key");
		}
	}

	/**
	 * Generate completion using OpenRouter
	 */
	async complete(
		messages: OpenRouterMessage[],
		modelOverride?: string,
	): Promise<AIResponse> {
		const startTime = Date.now();
		const modelToUse = modelOverride || this.config.model;

		// Check cache first (cache key includes model to avoid cross-model pollution)
		const cacheKey = this.getCacheKey(messages, modelToUse);
		if (this.config.cacheEnabled) {
			const cached = this.getFromCache(cacheKey);
			if (cached) {
				loggers.ai.info("OpenRouter cache hit", { model: modelToUse });
				return {
					content: cached,
					tokensUsed: { input: 0, output: 0 },
					cost: 0,
					latency: Date.now() - startTime,
					cached: true,
				};
			}
		}

		try {
			const response = await this.callOpenRouterAPI(messages, modelToUse);
			const content = response.choices[0]?.message?.content || "";
			const latency = Date.now() - startTime;

			const inputTokens = response.usage.prompt_tokens;
			const outputTokens = response.usage.completion_tokens;

			// Cost calculation is complex with OpenRouter as it varies per model.
			// For now we return 0 or implement a lookup table later if needed.
			// Ideally, OpenRouter provides cost in headers or response extension, but standard usage doesn't always strictly guarantee it in a uniform way across all models for simple calculation.
			// We will assume a placeholder calculation or 0 for now.
			const cost = 0;

			// Cache the response
			if (this.config.cacheEnabled && content) {
				this.setCache(cacheKey, content);
			}

			loggers.ai.info("OpenRouter completion succeeded", {
				model: modelToUse,
				latency,
				tokens: inputTokens + outputTokens,
			});

			return {
				content,
				tokensUsed: { input: inputTokens, output: outputTokens },
				// Cost tracking is a placeholder until model-specific billing metadata is plumbed.
				cost,
				latency,
				cached: false,
			};
		} catch (error) {
			loggers.ai.error("OpenRouter API request failed", {
				model: modelToUse,
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(
				`OpenRouter API error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Helper for code validation tasks (typically used by Validator Agent)
	 */
	async validateCode(
		code: string,
		context: string,
		systemPrompt?: string,
	): Promise<AIResponse> {
		const messages: OpenRouterMessage[] = [
			{
				role: "system",
				content:
					systemPrompt ||
					"You are an expert code validator specializing in XML generation and SUNAT compliance.",
			},
			{
				role: "user",
				content: `Context: ${context}\n\nCode to validate:\n\
\
${code}
\
\
Provide validation results in JSON format.`,
			},
		];

		// Use a cheap/fast model for validation if not critical, or the default configured one
		// For validation, we might want to stick to the configured 'smart' model or use a cheaper one like deepseek.
		return this.complete(messages);
	}

	private async callOpenRouterAPI(
		messages: OpenRouterMessage[],
		model: string,
	): Promise<OpenRouterCompletionResponse> {
		const requestBody: OpenRouterCompletionRequest = {
			model: model,
			messages,
			max_tokens: this.config.maxTokens,
			temperature: this.config.temperature,
			stream: false,
		};

		const response = await fetch(`${this.BASE_URL}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.config.apiKey}`,
				"HTTP-Referer": this.config.siteUrl, // Required by OpenRouter
				"X-Title": this.config.siteName, // Required by OpenRouter
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenRouter API HTTP ${response.status}: ${errorText}`);
		}

		return response.json() as Promise<OpenRouterCompletionResponse>;
	}

	private getCacheKey(messages: OpenRouterMessage[], model: string): string {
		const content = messages.map((m) => `${m.role}:${m.content}`).join("|");
		return createHash("sha256").update(`${model}:${content}`).digest("hex");
	}

	private getFromCache(key: string): string | null {
		const cached = this.cache.get(key);
		if (!cached) return null;

		if (Date.now() - cached.timestamp > this.CACHE_TTL) {
			this.cache.delete(key);
			return null;
		}

		return cached.content;
	}

	private setCache(key: string, content: string): void {
		this.cache.set(key, { content, timestamp: Date.now() });

		if (this.cache.size > 100) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}
	}

	clearCache(): void {
		this.cache.clear();
		loggers.ai.info("OpenRouter cache cleared");
	}

	getCacheStats(): { size: number; ttl: number } {
		return {
			size: this.cache.size,
			ttl: this.CACHE_TTL,
		};
	}
}
