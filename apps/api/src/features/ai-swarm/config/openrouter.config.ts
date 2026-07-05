/**
 * OpenRouter Configuration for Agent Swarm
 *
 * Defines model selection, fallback chains, and budget limits
 * for the multi-agent system.
 *
 * @see https://openrouter.ai/docs/api/reference
 * @module ai-swarm/config
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/**
 * OpenRouter API configuration
 * @example
 * ```ts
 * console.log(OPENROUTER_CONFIG);
 * ```
 */

export const OPENROUTER_CONFIG = {
	apiKey: process.env.OPENROUTER_API_KEY?.trim(),
	baseURL:
		process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",
	httpReferer: process.env.OPENROUTER_HTTP_REFERER?.trim(),
	appTitle: process.env.OPENROUTER_APP_TITLE?.trim() || "ARKELYTHEX",
} as const;

/**
 * Budget limits for cost control
 * @example
 * ```ts
 * console.log(BUDGET_LIMITS);
 * ```
 */

export const BUDGET_LIMITS = {
	daily: 50, // USD
	monthly: 500, // USD
	perTask: 1, // USD
} as const;

/**
 * Model selection per agent type
 *
 * Each agent uses a specific model optimized for its task:
 * - Orchestrator: Reasoning model (Claude 3.5 Sonnet)
 * - OCR: Vision-capable model (GPT-4 Vision)
 * - SUNAT: Fast/cheap model (Gemini Flash)
 * - PCGE: Reasoning model (Gemini Flash Thinking)
 * - Reconciliation: Code-capable model (GPT-4 Turbo)
 * @example
 * ```ts
 * console.log(MODEL_CONFIG);
 * ```
 */

export const MODEL_CONFIG = {
	orchestrator: {
		primary: "anthropic/claude-3.5-sonnet",
		fallback: "google/gemini-2.0-flash-thinking-exp:free",
		costPer1K: 0.003, // USD
	},
	ocr: {
		primary: "openai/gpt-4-vision-preview",
		fallback: "anthropic/claude-3-opus",
		costPer1K: 0.01, // USD per image
	},
	sunat: {
		primary: "google/gemini-2.0-flash-exp:free",
		fallback: "meta-llama/llama-3.1-8b-instruct:free",
		costPer1K: 0.0005, // USD
	},
	pcge: {
		primary: "google/gemini-2.0-flash-thinking-exp:free",
		fallback: "openai/gpt-4-turbo",
		costPer1K: 0.001, // USD
	},
	reconciliation: {
		primary: "openai/gpt-4-turbo",
		fallback: "anthropic/claude-3.5-sonnet",
		costPer1K: 0.005, // USD
	},
} as const;

/**
 * Rate limiting configuration
 * @example
 * ```ts
 * console.log(RATE_LIMITS);
 * ```
 */

export const RATE_LIMITS = {
	maxConcurrent: 10, // Max parallel requests
	retryAttempts: 3,
	retryDelay: 1000, // ms
	timeoutMs: 30000, // 30 seconds
} as const;

/**
 * Create OpenRouter client instance
 * @returns Result of hasOpenRouterKey.
 * @example
 * ```ts
 * const result = hasOpenRouterKey();
 * console.log(result);
 * ```
 */

export function hasOpenRouterKey(): boolean {
	return Boolean(OPENROUTER_CONFIG.apiKey);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(response: Response): number | null {
	const header = response.headers.get("retry-after");
	if (!header) return null;

	const asSeconds = Number(header);
	if (Number.isFinite(asSeconds)) return Math.max(0, asSeconds) * 1000;

	const asDate = Date.parse(header);
	if (Number.isFinite(asDate)) return Math.max(0, asDate - Date.now());

	return null;
}

const openrouterFetch: typeof fetch = async (input, init) => {
	const retryable = new Set([429, 500, 502, 503, 504]);
	let attempt = 0;

	// We do exponential backoff with jitter, respecting Retry-After when present.
	while (true) {
		const response = await fetch(input, init);

		if (
			!retryable.has(response.status) ||
			attempt >= RATE_LIMITS.retryAttempts
		) {
			return response;
		}

		// Free resources before retrying.
		try {
			await response.arrayBuffer();
		} catch {
			// Ignore.
		}

		const retryAfterMs = getRetryAfterMs(response);
		const jitterMs = Math.floor(Math.random() * 250);
		const backoffMs = RATE_LIMITS.retryDelay * 2 ** attempt + jitterMs;
		const waitMs = Math.min(retryAfterMs ?? backoffMs, RATE_LIMITS.timeoutMs);

		attempt += 1;
		await sleep(waitMs);
	}
};

const openrouterProvider = createOpenRouter({
	apiKey: OPENROUTER_CONFIG.apiKey,
	baseURL: OPENROUTER_CONFIG.baseURL,
	compatibility: "strict",
	fetch: openrouterFetch,
	// OpenRouter recommends these optional headers for attribution / analytics.
	// Ref: https://openrouter.ai/docs/api-reference/parameters
	headers: {
		...(OPENROUTER_CONFIG.httpReferer
			? { "HTTP-Referer": OPENROUTER_CONFIG.httpReferer }
			: {}),
		...(OPENROUTER_CONFIG.appTitle
			? { "X-Title": OPENROUTER_CONFIG.appTitle }
			: {}),
	},
});

/**
 * openrouter operation.
 *
 * @param modelId - Input for modelId.
 * @returns Result of openrouter.
 * @example
 * ```ts
 * const result = openrouter("");
 * console.log(result);
 * ```
 */
export const openrouter = (modelId: string) => openrouterProvider(modelId);

/**
 * Get model for specific agent type
 * @param agentType - Input for agentType.
 * @param useFallback - Input for useFallback.
 * @returns Result of getModelForAgent.
 * @example
 * ```ts
 * const result = getModelForAgent(undefined, undefined);
 * console.log(result);
 * ```
 */

export function getModelForAgent(
	agentType: keyof typeof MODEL_CONFIG,
	useFallback = false,
): string {
	const config = MODEL_CONFIG[agentType];
	return useFallback ? config.fallback : config.primary;
}

/**
 * Calculate estimated cost for a task
 * @param agentType - Input for agentType.
 * @param tokenCount - Input for tokenCount.
 * @returns Result of estimateCost.
 * @example
 * ```ts
 * const result = estimateCost(undefined, 0);
 * console.log(result);
 * ```
 */

export function estimateCost(
	agentType: keyof typeof MODEL_CONFIG,
	tokenCount: number,
): number {
	const costPer1K = MODEL_CONFIG[agentType].costPer1K;
	return (tokenCount / 1000) * costPer1K;
}
