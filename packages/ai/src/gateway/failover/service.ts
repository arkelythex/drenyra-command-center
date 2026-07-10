import { loggers } from "../../services/logger";
import type { FailoverAttempt, LLMProvider } from "../types";
import { LLMGatewayError } from "../types";
import { ProviderCircuit } from "./strategies";
import type { FailoverChain, ProviderHealth } from "./types";
import { CircuitState } from "./types";

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

	private initializeDefaultChains(): void {
		this.defaultChains.set("anthropic", {
			primary: "anthropic",
			fallbacks: ["openai", "google", "openrouter"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		this.defaultChains.set("openai", {
			primary: "openai",
			fallbacks: ["anthropic", "google", "openrouter"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		this.defaultChains.set("google", {
			primary: "google",
			fallbacks: ["openai", "anthropic", "openrouter"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		this.defaultChains.set("grok", {
			primary: "grok",
			fallbacks: ["openai", "anthropic"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		this.defaultChains.set("openrouter", {
			primary: "openrouter",
			fallbacks: ["openai", "anthropic"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});

		this.defaultChains.set("ollama", {
			primary: "ollama",
			fallbacks: ["openrouter", "openai"],
			maxRetries: 2,
			retryDelayMs: 1000,
		});
	}

	getChain(provider: LLMProvider): FailoverChain {
		return this.defaultChains.get(provider)!;
	}

	setChain(provider: LLMProvider, chain: FailoverChain): void {
		this.defaultChains.set(provider, chain);
		loggers.ai.info("Updated failover chain", { provider, chain });
	}

	canExecute(provider: LLMProvider): boolean {
		let circuit = this.circuits.get(provider);
		if (!circuit) {
			circuit = new ProviderCircuit();
			this.circuits.set(provider, circuit);
		}
		return circuit.canExecute();
	}

	async executeWithFailover<T>(
		requestProvider: LLMProvider,
		executor: (provider: LLMProvider) => Promise<T>,
	): Promise<[T, LLMProvider]> {
		const chain = this.getChain(requestProvider);
		const providers = [chain.primary, ...chain.fallbacks];

		let lastError: Error | null = null;
		const attempts: FailoverAttempt[] = [];

		for (const provider of providers) {
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

				this.recordFailure(provider, latency);
				attempts.push({
					provider,
					success: false,
					error: this.wrapError(lastError, provider),
					latencyMs: latency,
				});

				if (chain.retryDelayMs > 0) {
					await this.sleep(chain.retryDelayMs);
				}
			}
		}

		throw new Error(
			`All providers failed. Last error: ${lastError?.message ?? "Unknown"}`,
		);
	}

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

	recordSuccess(provider: LLMProvider, latencyMs: number): void {
		let circuit = this.circuits.get(provider);
		if (!circuit) {
			circuit = new ProviderCircuit();
			this.circuits.set(provider, circuit);
		}
		circuit.recordSuccess();

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

	recordFailure(provider: LLMProvider, latencyMs: number): void {
		let circuit = this.circuits.get(provider);
		if (!circuit) {
			circuit = new ProviderCircuit();
			this.circuits.set(provider, circuit);
		}
		circuit.recordFailure();

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

	resetCircuit(provider: LLMProvider): void {
		this.circuits.delete(provider);
		loggers.ai.info("Reset circuit breaker", { provider });
	}

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

export const failoverService = new FailoverService();
