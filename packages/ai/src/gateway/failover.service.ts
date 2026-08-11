/**
 * LLM Gateway - Failover Service
 *
 * Implements automatic failover logic for LLM providers.
 * Handles circuit breaker pattern and provider health tracking.
 *
 * @module @drenyra/ai/gateway
 */

import { loggers } from "../logger";
import type { FailoverAttempt, LLMProvider } from "./types";
import { LLMGatewayError } from "./types";

/**
 * Circuit breaker states.
 */
enum CircuitState {
	CLOSED = "closed", // Normal operation
	OPEN = "open", // Failing, reject requests
	HALF_OPEN = "half_open", // Testing recovery
}

/**
 * Circuit breaker configuration.
 */
interface CircuitBreakerConfig {
	failureThreshold: number; // Failures before opening
	successThreshold: number; // Successes to close from half-open
	timeout: number; // ms before trying half-open
}

/**
 * Circuit breaker for a provider.
 */
class ProviderCircuit {
	state: CircuitState = CircuitState.CLOSED;
	failureCount = 0;
	successCount = 0;
	lastFailureTime = 0;
	private config: CircuitBreakerConfig;

	constructor(config?: Partial<CircuitBreakerConfig>) {
		this.config = {
			failureThreshold: config?.failureThreshold ?? 5,
			successThreshold: config?.successThreshold ?? 2,
			timeout: config?.timeout ?? 60000, // 1 minute
		};
	}

	/**
	 * Record a successful request.
	 */
	recordSuccess(): void {
		this.failureCount = 0;

		if (this.state === CircuitState.HALF_OPEN) {
			this.successCount++;
			if (this.successCount >= this.config.successThreshold) {
				this.state = CircuitState.CLOSED;
				this.successCount = 0;
				loggers.ai.info("Circuit breaker closed", { state: this.state });
			}
		}
	}

	/**
	 * Record a failed request.
	 */
	recordFailure(): void {
		this.failureCount++;
		this.lastFailureTime = Date.now();
		this.successCount = 0;

		if (
			this.state === CircuitState.CLOSED &&
			this.failureCount >= this.config.failureThreshold
		) {
			this.state = CircuitState.OPEN;
			loggers.ai.warn("Circuit breaker opened", {
				failures: this.failureCount,
			});
		}
	}

	/**
	 * Check if requests are allowed.
	 */
	canExecute(): boolean {
		if (this.state === CircuitState.CLOSED) {
			return true;
		}

		if (this.state === CircuitState.OPEN) {
			// Check if timeout has passed to try half-open
			if (Date.now() - this.lastFailureTime >= this.config.timeout) {
				this.state = CircuitState.HALF_OPEN;
				this.successCount = 0;
				loggers.ai.info("Circuit breaker half-open", {
					timeout: this.config.timeout,
				});
				return true;
			}
			return false;
		}

		// Half-open state - allow requests
		return true;
	}

	/**
	 * Get current state.
	 */
	getState(): CircuitState {
		return this.state;
	}
}

/**
 * Failover chain configuration.
 */
export interface FailoverChain {
	primary: LLMProvider;
	fallbacks: LLMProvider[];
	maxRetries: number;
	retryDelayMs: number;
}

/**
 * Provider health metrics.
 */
export interface ProviderHealth {
	provider: LLMProvider;
	isHealthy: boolean;
	circuitState: CircuitState;
	successRate: number;
	totalRequests: number;
	failedRequests: number;
	avgLatencyMs: number;
	lastUsed?: Date | undefined;
}

/**
 * Failover Service with Circuit Breaker pattern.
 *
 * Manages provider health and automatic failover on errors.
 */
export class FailoverService {
	private circuits: Map<LLMProvider, ProviderCircuit> = new Map();
	private healthMetrics: Map<
		LLMProvider,
		{
			totalRequests: number;
			failedRequests: number;
			totalLatencyMs: number;
			lastUsed?: Date;
		}
	> = new Map();

	private defaultChains: Map<LLMProvider, FailoverChain> = new Map();

	constructor() {
		this.initializeDefaultChains();
	}

	/**
	 * Initialize default failover chains.
	 */
	private initializeDefaultChains(): void {
		// Anthropic -> OpenAI -> Google -> OpenRouter
		this.defaultChains.set("anthropic", {
			primary: "anthropic",
			fallbacks: ["openai", "google", "openrouter"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		// OpenAI -> Anthropic -> Google -> OpenRouter
		this.defaultChains.set("openai", {
			primary: "openai",
			fallbacks: ["anthropic", "google", "openrouter"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		// Google -> OpenAI -> Anthropic -> OpenRouter
		this.defaultChains.set("google", {
			primary: "google",
			fallbacks: ["openai", "anthropic", "openrouter"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		// Grok -> OpenAI -> Anthropic
		this.defaultChains.set("grok", {
			primary: "grok",
			fallbacks: ["openai", "anthropic"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		// OpenRouter as aggregator already has fallbacks
		this.defaultChains.set("openrouter", {
			primary: "openrouter",
			fallbacks: ["openai", "anthropic"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		// Ollama -> OpenRouter -> OpenAI (local first, then cloud fallback)
		this.defaultChains.set("ollama", {
			primary: "ollama",
			fallbacks: ["openrouter", "openai"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});
	}

	/**
	 * Get failover chain for a provider.
	 */
	getChain(provider: LLMProvider): FailoverChain {
		return this.defaultChains.get(provider)!;
	}

	/**
	 * Set custom failover chain for a provider.
	 */
	setChain(provider: LLMProvider, chain: FailoverChain): void {
		this.defaultChains.set(provider, chain);
		loggers.ai.info("Updated failover chain", { provider, chain });
	}

	/**
	 * Check if a provider can handle requests (circuit breaker check).
	 */
	canExecute(provider: LLMProvider): boolean {
		let circuit = this.circuits.get(provider);
		if (!circuit) {
			circuit = new ProviderCircuit();
			this.circuits.set(provider, circuit);
		}
		return circuit.canExecute();
	}

	/**
	 * Execute with automatic failover.
	 *
	 * @param requestProvider - Requested primary provider
	 * @param executor - Async function to execute for each provider
	 * @returns Tuple of [result, provider used]
	 */
	async executeWithFailover<T>(
		requestProvider: LLMProvider,
		executor: (provider: LLMProvider) => Promise<T>,
	): Promise<[T, LLMProvider]> {
		const chain = this.getChain(requestProvider);
		const providers = [chain.primary, ...chain.fallbacks];

		let lastError: Error | null = null;
		const attempts: FailoverAttempt[] = [];

		for (const provider of providers) {
			// Check circuit breaker
			if (!this.canExecute(provider)) {
				loggers.ai.warn("Circuit breaker open, skipping provider", {
					provider,
				});
				continue;
			}

			const startTime = Date.now();
			try {
				loggers.ai.info("Attempting provider", { provider });
				const result = await executor(provider);

				// Record success
				this.recordSuccess(provider, Date.now() - startTime);
				attempts.push({
					provider,
					success: true,
					latencyMs: Date.now() - startTime,
				});

				return [result, provider];
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				const latency = Date.now() - startTime;

				loggers.ai.error("Provider failed", {
					provider,
					error: lastError.message,
					latencyMs: latency,
				});

				// Record failure
				this.recordFailure(provider, latency);
				attempts.push({
					provider,
					success: false,
					error: this.wrapError(lastError, provider),
					latencyMs: latency,
				});

				// Wait before retry if configured
				if (chain.retryDelayMs > 0) {
					await this.sleep(chain.retryDelayMs);
				}
			}
		}

		// All providers failed
		throw new Error(
			`All providers failed. Last error: ${lastError?.message ?? "Unknown"}`,
		);
	}

	/**
	 * Get next available provider from chain.
	 */
	getNextProvider(requestProvider: LLMProvider): LLMProvider | null {
		const chain = this.getChain(requestProvider);
		const providers = [chain.primary, ...chain.fallbacks];

		for (const provider of providers) {
			if (this.canExecute(provider)) {
				return provider;
			}
		}

		return null;
	}

	/**
	 * Record successful request for a provider.
	 */
	recordSuccess(provider: LLMProvider, latencyMs: number): void {
		// Update circuit breaker
		let circuit = this.circuits.get(provider);
		if (!circuit) {
			circuit = new ProviderCircuit();
			this.circuits.set(provider, circuit);
		}
		circuit.recordSuccess();

		// Update metrics
		let metrics = this.healthMetrics.get(provider);
		if (!metrics) {
			metrics = {
				totalRequests: 0,
				failedRequests: 0,
				totalLatencyMs: 0,
			};
			this.healthMetrics.set(provider, metrics);
		}

		metrics.totalRequests++;
		metrics.totalLatencyMs += latencyMs;
		metrics.lastUsed = new Date();
	}

	/**
	 * Record failed request for a provider.
	 */
	recordFailure(provider: LLMProvider, latencyMs: number): void {
		// Update circuit breaker
		let circuit = this.circuits.get(provider);
		if (!circuit) {
			circuit = new ProviderCircuit();
			this.circuits.set(provider, circuit);
		}
		circuit.recordFailure();

		// Update metrics
		let metrics = this.healthMetrics.get(provider);
		if (!metrics) {
			metrics = {
				totalRequests: 0,
				failedRequests: 0,
				totalLatencyMs: 0,
			};
			this.healthMetrics.set(provider, metrics);
		}

		metrics.totalRequests++;
		metrics.failedRequests++;
		metrics.totalLatencyMs += latencyMs;
	}

	/**
	 * Get health status for all providers.
	 */
	getHealthStatus(): ProviderHealth[] {
		const providers: LLMProvider[] = [
			"anthropic",
			"openai",
			"google",
			"grok",
			"openrouter",
			"ollama",
		];

		return providers.map((provider) => {
			const circuit = this.circuits.get(provider) ?? new ProviderCircuit();
			const metrics = this.healthMetrics.get(provider) ?? {
				totalRequests: 0,
				failedRequests: 0,
				totalLatencyMs: 0,
			};

			const successRate =
				metrics.totalRequests > 0
					? (metrics.totalRequests - metrics.failedRequests) /
						metrics.totalRequests
					: 1;

			return {
				provider,
				isHealthy: circuit.getState() === CircuitState.CLOSED,
				circuitState: circuit.getState(),
				successRate,
				totalRequests: metrics.totalRequests,
				failedRequests: metrics.failedRequests,
				avgLatencyMs:
					metrics.totalRequests > 0
						? metrics.totalLatencyMs / metrics.totalRequests
						: 0,
				lastUsed: metrics.lastUsed,
			};
		});
	}

	/**
	 * Reset circuit breaker for a provider.
	 */
	resetCircuit(provider: LLMProvider): void {
		this.circuits.delete(provider);
		loggers.ai.info("Reset circuit breaker", { provider });
	}

	/**
	 * Reset all circuits and metrics.
	 */
	resetAll(): void {
		this.circuits.clear();
		this.healthMetrics.clear();
		loggers.ai.info("Reset all circuit breakers and metrics");
	}

	private wrapError(error: Error, provider: LLMProvider): LLMGatewayError {
		return new LLMGatewayError(error.message, "PROVIDER_ERROR", provider, 500, {
			originalError: error.name,
		});
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Default failover service instance.
 */
export const failoverService = new FailoverService();
