/**
 * LLM Gateway - Cost Tracker Service
 *
 * Calculates actual cost per request based on provider pricing.
 * Supports multiple pricing models and provides cost aggregation.
 *
 * @module @drenyra/ai/gateway
 */

import type { LLMProvider } from "./types";

/**
 * Pricing model for a specific model on a provider.
 * Prices are in USD per 1M tokens.
 */
export interface ModelPricing {
	/** Model identifier (e.g., "gpt-5", "claude-sonnet-4") */
	model: string;
	/** Provider */
	provider: LLMProvider;
	/** Price per 1M input tokens */
	promptPricePerM: number;
	/** Price per 1M output tokens */
	completionPricePerM: number;
	/** Whether this is a cached/cheaper model variant */
	isCached?: boolean;
	/** Effective date of this pricing */
	effectiveFrom: Date;
}

/**
 * Default pricing based on 2026 rates.
 * These should be updated periodically as providers change prices.
 */
const DEFAULT_PRICING: ModelPricing[] = [
	// Anthropic (Claude 4.5 series)
	{
		model: "claude-3-5-haiku-latest",
		provider: "anthropic",
		promptPricePerM: 0.8,
		completionPricePerM: 4.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	{
		model: "claude-sonnet-4-20250514",
		provider: "anthropic",
		promptPricePerM: 3.0,
		completionPricePerM: 15.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	{
		model: "claude-opus-4-20250514",
		provider: "anthropic",
		promptPricePerM: 15.0,
		completionPricePerM: 75.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	// OpenAI (GPT-5 series)
	{
		model: "gpt-5",
		provider: "openai",
		promptPricePerM: 2.5,
		completionPricePerM: 10.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	{
		model: "gpt-5-turbo",
		provider: "openai",
		promptPricePerM: 1.0,
		completionPricePerM: 4.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	// Google (Gemini 2.5 series)
	{
		model: "gemini-2.5-flash",
		provider: "google",
		promptPricePerM: 0.15,
		completionPricePerM: 0.6,
		effectiveFrom: new Date("2026-01-01"),
	},
	{
		model: "gemini-2.5-pro-preview-06-05",
		provider: "google",
		promptPricePerM: 1.25,
		completionPricePerM: 5.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	// Grok
	{
		model: "grok-2-1212",
		provider: "grok",
		promptPricePerM: 0.5,
		completionPricePerM: 2.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	// OpenRouter (uses Anthropic/OpenAI under the hood)
	{
		model: "openrouter/auto",
		provider: "openrouter",
		promptPricePerM: 0.5, // Uses cheapest available
		completionPricePerM: 2.0,
		effectiveFrom: new Date("2026-01-01"),
	},
	{
		model: "anthropic/claude-sonnet-4-20250514",
		provider: "openrouter",
		promptPricePerM: 3.5, // Includes OpenRouter markup
		completionPricePerM: 17.5,
		effectiveFrom: new Date("2026-01-01"),
	},
];

/**
 * Cost calculation result.
 */
export interface CostCalculation {
	/** Cost in USD */
	costUsd: number;
	/** Breakdown of calculation */
	breakdown: {
		promptTokens: number;
		promptCostUsd: number;
		completionTokens: number;
		completionCostUsd: number;
		pricing: ModelPricing;
	};
}

/**
 * Cost aggregation for reporting.
 */
export interface CostAggregation {
	/** Time period */
	period: "hourly" | "daily" | "monthly";
	/** Total cost in USD */
	totalCostUsd: number;
	/** Cost by provider */
	costByProvider: Record<LLMProvider, number>;
	/** Cost by model */
	costByModel: Record<string, number>;
	/** Total tokens */
	totalTokens: number;
	/** Number of requests */
	requestCount: number;
	/** Average cost per request */
	avgCostPerRequest: number;
}

/**
 * Cost Tracker Service.
 *
 * Calculates LLM request costs based on token usage and provider pricing.
 */
export class CostTracker {
	private pricing: ModelPricing[];
	private customPricing: Map<string, ModelPricing> = new Map();

	constructor(customPricing?: ModelPricing[]) {
		this.pricing = customPricing ?? DEFAULT_PRICING;
	}

	/**
	 * Calculate cost for a request.
	 */
	calculate(
		model: string,
		provider: LLMProvider,
		promptTokens: number,
		completionTokens: number,
	): CostCalculation {
		// Ollama has no API cost - local inference
		if (provider === "ollama") {
			return {
				costUsd: 0,
				breakdown: {
					promptTokens,
					promptCostUsd: 0,
					completionTokens,
					completionCostUsd: 0,
					pricing: {
						model,
						provider,
						promptPricePerM: 0,
						completionPricePerM: 0,
						effectiveFrom: new Date(),
					},
				},
			};
		}

		const pricing = this.getPricing(model, provider);

		const promptCostUsd = (promptTokens / 1_000_000) * pricing.promptPricePerM;
		const completionCostUsd =
			(completionTokens / 1_000_000) * pricing.completionPricePerM;
		const totalCostUsd = promptCostUsd + completionCostUsd;

		return {
			costUsd: Math.round(totalCostUsd * 100_000) / 100_000, // Round to 5 decimal places
			breakdown: {
				promptTokens,
				promptCostUsd: Math.round(promptCostUsd * 100_000) / 100_000,
				completionTokens,
				completionCostUsd: Math.round(completionCostUsd * 100_000) / 100_000,
				pricing,
			},
		};
	}

	/**
	 * Get pricing for a specific model and provider.
	 */
	getPricing(model: string, provider: LLMProvider): ModelPricing {
		// Check custom pricing first
		const customKey = `${provider}:${model}`;
		const custom = this.customPricing.get(customKey);
		if (custom) return custom;

		// Find matching pricing
		const match = this.pricing.find(
			(p) =>
				p.provider === provider &&
				(model === p.model || model.includes(p.model)),
		);

		if (match) return match;

		// Fallback to provider-level default
		const providerDefault = this.pricing.find(
			(p) => p.provider === provider && p.model === model,
		);

		if (providerDefault) return providerDefault;

		// Last resort: return OpenRouter auto pricing
		return {
			model: "unknown",
			provider,
			promptPricePerM: 1.0,
			completionPricePerM: 4.0,
			effectiveFrom: new Date(),
		};
	}

	/**
	 * Add custom pricing for a model.
	 */
	addCustomPricing(pricing: ModelPricing): void {
		const key = `${pricing.provider}:${pricing.model}`;
		this.customPricing.set(key, pricing);
	}

	/**
	 * Get all available pricing options.
	 */
	getAllPricing(): ModelPricing[] {
		return [...this.pricing, ...Array.from(this.customPricing.values())];
	}

	/**
	 * Get pricing for a specific provider.
	 */
	getPricingForProvider(provider: LLMProvider): ModelPricing[] {
		return this.getAllPricing().filter((p) => p.provider === provider);
	}

	/**
	 * Calculate cost aggregation from metrics history.
	 */
	aggregateCosts(
		metrics: Array<{
			provider: LLMProvider;
			model: string;
			promptTokens: number;
			completionTokens: number;
			totalTokens: number;
			costUsd: number;
		}>,
		period: CostAggregation["period"] = "daily",
	): CostAggregation {
		if (metrics.length === 0) {
			return {
				period,
				totalCostUsd: 0,
				costByProvider: {} as Record<LLMProvider, number>,
				costByModel: {},
				totalTokens: 0,
				requestCount: 0,
				avgCostPerRequest: 0,
			};
		}

		const costByProvider: Record<string, number> = {};
		const costByModel: Record<string, number> = {};
		let totalCostUsd = 0;
		let totalTokens = 0;

		for (const m of metrics) {
			const cost =
				m.costUsd ||
				this.calculate(
					m.model,
					m.provider as LLMProvider,
					m.promptTokens,
					m.completionTokens,
				).costUsd;
			totalCostUsd += cost;
			totalTokens += m.totalTokens;

			costByProvider[m.provider] = (costByProvider[m.provider] ?? 0) + cost;
			costByModel[m.model] = (costByModel[m.model] ?? 0) + cost;
		}

		return {
			period,
			totalCostUsd: Math.round(totalCostUsd * 100_000) / 100_000,
			costByProvider: costByProvider as unknown as Record<LLMProvider, number>,
			costByModel,
			totalTokens,
			requestCount: metrics.length,
			avgCostPerRequest:
				Math.round((totalCostUsd / metrics.length) * 100_000) / 100_000,
		};
	}
}

/**
 * Default cost tracker instance.
 */
export const costTracker = new CostTracker();
