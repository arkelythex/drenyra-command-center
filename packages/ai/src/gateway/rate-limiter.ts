/**
 * LLM Gateway - Rate Limiter
 *
 * Implements token bucket rate limiting for LLM providers.
 * Uses in-memory sliding window with optional Redis support.
 *
 * @module @drenyra/ai/gateway
 */

import { loggers } from "../logger";
import type { LLMProvider, RateLimitCheck } from "./types";

/**
 * Rate limiter configuration per provider.
 */
export interface RateLimiterConfig {
	requestsPerMinute: number;
	requestsPerDay: number;
}

/**
 * Rate limiter state for a provider.
 */
interface ProviderRateState {
	requestsPerMinute: number;
	requestsPerDay: number;
	minuteWindowStart: Date;
	minuteCount: number;
	dayWindowStart: Date;
	dayCount: number;
}

/**
 * Token Bucket Rate Limiter for LLM providers.
 *
 * Implements sliding window algorithm with per-provider limits.
 */
export class RateLimiter {
	private providerStates: Map<string, ProviderRateState> = new Map();
	private config: Map<LLMProvider, RateLimiterConfig>;

	constructor(customConfigs?: Partial<Record<LLMProvider, RateLimiterConfig>>) {
		// Default rate limits per provider (conservative defaults)
		const defaults: Record<LLMProvider, RateLimiterConfig> = {
			anthropic: { requestsPerMinute: 50, requestsPerDay: 5000 },
			openai: { requestsPerMinute: 60, requestsPerDay: 5000 },
			google: { requestsPerMinute: 60, requestsPerDay: 6000 },
			grok: { requestsPerMinute: 30, requestsPerDay: 3000 },
			openrouter: { requestsPerMinute: 100, requestsPerDay: 10000 },
			ollama: { requestsPerMinute: 1000, requestsPerDay: 100000 },
			deepseek: { requestsPerMinute: 30, requestsPerDay: 3000 },
		};

		// Merge with custom configs
		this.config = new Map();
		for (const provider of Object.keys(defaults) as LLMProvider[]) {
			this.config.set(
				provider,
				customConfigs?.[provider] ?? defaults[provider],
			);
		}
	}

	/**
	 * Check if a request is allowed under rate limits.
	 *
	 * @param organizationId - Organization identifier
	 * @param provider - LLM provider
	 * @returns Rate limit check result
	 */
	check(organizationId: number, provider: LLMProvider): RateLimitCheck {
		const key = this.getKey(organizationId, provider);
		let state = this.providerStates.get(key);

		// Initialize state if not exists
		if (!state) {
			const config = this.config.get(provider)!;
			state = {
				requestsPerMinute: config.requestsPerMinute,
				requestsPerDay: config.requestsPerDay,
				minuteWindowStart: new Date(),
				minuteCount: 0,
				dayWindowStart: new Date(),
				dayCount: 0,
			};
			this.providerStates.set(key, state);
		}

		// Reset minute window if expired
		const now = new Date();
		const minuteElapsed = now.getTime() - state.minuteWindowStart.getTime();
		if (minuteElapsed >= 60000) {
			state.minuteWindowStart = now;
			state.minuteCount = 0;
		}

		// Reset day window if expired
		const dayElapsed = now.getTime() - state.dayWindowStart.getTime();
		if (dayElapsed >= 86400000) {
			state.dayWindowStart = now;
			state.dayCount = 0;
		}

		// Check limits
		const minuteAllowed = state.minuteCount < state.requestsPerMinute;
		const dayAllowed = state.dayCount < state.requestsPerDay;

		return {
			allowed: minuteAllowed && dayAllowed,
			currentRpm: state.minuteCount,
			currentRpd: state.dayCount,
			windowRpmResetsAt: new Date(state.minuteWindowStart.getTime() + 60000),
			windowRpdResetsAt: new Date(state.dayWindowStart.getTime() + 86400000),
		};
	}

	/**
	 * Increment the request counter after a successful request.
	 *
	 * @param organizationId - Organization identifier
	 * @param provider - LLM provider
	 */
	increment(organizationId: number, provider: LLMProvider): void {
		const key = this.getKey(organizationId, provider);
		const state = this.providerStates.get(key);

		if (state) {
			state.minuteCount++;
			state.dayCount++;
		}
	}

	/**
	 * Wait duration if rate limited (for automatic retry).
	 *
	 * @param organizationId - Organization identifier
	 * @param provider - LLM provider
	 * @returns Milliseconds to wait, or 0 if not rate limited
	 */
	getRetryAfter(organizationId: number, provider: LLMProvider): number {
		const check = this.check(organizationId, provider);
		if (check.allowed) return 0;

		// Return the smaller wait time
		const rpmWait = check.windowRpmResetsAt.getTime() - Date.now();
		const rpdWait = check.windowRpdResetsAt.getTime() - Date.now();

		return Math.max(0, Math.min(rpmWait, rpdWait));
	}

	/**
	 * Get current rate limit status without incrementing.
	 *
	 * @param organizationId - Organization identifier
	 * @param provider - LLM provider
	 */
	getStatus(
		organizationId: number,
		provider: LLMProvider,
	): { remainingRpm: number; remainingRpd: number } {
		const check = this.check(organizationId, provider);
		const config = this.config.get(provider)!;

		return {
			remainingRpm: Math.max(0, config.requestsPerMinute - check.currentRpm),
			remainingRpd: Math.max(0, config.requestsPerDay - check.currentRpd),
		};
	}

	/**
	 * Update rate limits for a provider.
	 *
	 * @param provider - LLM provider
	 * @param config - New rate limit configuration
	 */
	updateConfig(provider: LLMProvider, config: RateLimiterConfig): void {
		this.config.set(provider, config);
		loggers.ai.info("Updated rate limit config", { provider, config });
	}

	/**
	 * Reset rate limits for an organization/provider.
	 *
	 * @param organizationId - Organization identifier
	 * @param provider - LLM provider (optional, resets all if not provided)
	 */
	reset(organizationId: number, provider?: LLMProvider): void {
		if (provider) {
			const key = this.getKey(organizationId, provider);
			this.providerStates.delete(key);
		} else {
			// Reset all providers for this org
			for (const k of this.providerStates.keys()) {
				if (k.startsWith(`${organizationId}:`)) {
					this.providerStates.delete(k);
				}
			}
		}
	}

	/**
	 * Get rate limit configuration for a provider.
	 */
	getConfig(provider: LLMProvider): RateLimiterConfig {
		return this.config.get(provider)!;
	}

	private getKey(organizationId: number, provider: LLMProvider): string {
		return `${organizationId}:${provider}`;
	}
}

/**
 * Default rate limiter instance.
 */
export const rateLimiter = new RateLimiter();
