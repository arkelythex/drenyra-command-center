/**
 * LLM Gateway - Main Gateway Service (Facade)
 *
 * Unified gateway service that routes requests to multiple LLM providers
 * with support for failover, rate limiting, and observability.
 *
 * Split from 724 lines → 4 modules (constants, request-executor, stream-executor, facade)
 *
 * @module @arkelythex/ai/gateway
 */

import type { ContextMonitor } from "../context-monitor";
import { loggers } from "../logger";
import { type BudgetEnforcer, budgetEnforcer } from "./budget-enforcer";
import { type CostTracker, costTracker } from "./cost-tracker";
import {
	type FailoverChain,
	type FailoverService,
	failoverService,
} from "./failover.service";
import { DEFAULT_CONFIG } from "./gateway.constants";
import { RequestExecutor } from "./gateway.request-executor";
import { StreamExecutor } from "./gateway.stream-executor";
import { type RateLimiter, rateLimiter } from "./rate-limiter";
import { llmGatewayTracer } from "./tracing";
import type {
	AuthenticatedChatRequest,
	ChatCompletionRequest,
	ChatCompletionResponse,
	ChatCompletionStreamChunk,
	LLMProvider,
	RequestMetrics,
} from "./types";
import { LLMGatewayError } from "./types";

export interface LLMGatewayConfig {
	defaultProvider: LLMProvider;
	enableFailover: boolean;
	enableRateLimiting: boolean;
	enableBudgetEnforcement: boolean;
	timeout: number;
	rateLimiter?: RateLimiter;
	failoverService?: FailoverService;
	costTracker?: CostTracker;
	budgetEnforcer?: BudgetEnforcer;
	contextMonitor?: ContextMonitor;
}

export class LLMGatewayService {
	private config: LLMGatewayConfig;
	private rateLimiter: RateLimiter;
	private failoverService: FailoverService;
	private costTracker: CostTracker;
	private budgetEnforcer: BudgetEnforcer;
	private contextMonitor?: ContextMonitor;
	private metrics: RequestMetrics[] = [];

	constructor(config?: Partial<LLMGatewayConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.rateLimiter = this.config.rateLimiter ?? rateLimiter;
		this.failoverService = this.config.failoverService ?? failoverService;
		this.costTracker = this.config.costTracker ?? costTracker;
		this.budgetEnforcer = this.config.budgetEnforcer ?? budgetEnforcer;
		this.contextMonitor = this.config.contextMonitor;
	}

	routeToProvider(request: ChatCompletionRequest): LLMProvider {
		if (request.provider) return request.provider;
		return this.config.defaultProvider;
	}

	async chat(
		request: AuthenticatedChatCompletionRequest,
		runId?: string,
	): Promise<ChatCompletionResponse> {
		const startTime = Date.now();
		const provider = this.routeToProvider(request);

		const span = llmGatewayTracer.startChatSpan({
			"llm.request.id": `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
			"llm.request.model": request.model,
			"llm.request.provider": provider,
			"llm.request.organization_id": request.organizationId,
			"llm.request.user_id": request.userId,
		});

		if (this.config.enableRateLimiting) {
			const rateCheck = this.rateLimiter.check(
				request.organizationId,
				provider,
			);
			if (!rateCheck.allowed) {
				const error = new LLMGatewayError(
					"Rate limit exceeded",
					"RATE_LIMIT_EXCEEDED",
					provider,
					429,
					{
						currentRpm: rateCheck.currentRpm,
						retryAfter: Math.ceil(
							(rateCheck.windowRpmResetsAt.getTime() - Date.now()) / 1000,
						),
					},
				);
				span.recordException(error);
				span.end({ error: true, "error.code": error.code });
				throw error;
			}
		}

		// ── Budget enforcement: reject if daily/monthly budget exceeded ─────
		if (this.config.enableBudgetEnforcement) {
			await this.budgetEnforcer.require(request.organizationId);
		}

		try {
			let response: ChatCompletionResponse;
			let actualProvider: LLMProvider;

			if (this.config.enableFailover) {
				const [result, usedProvider] =
					await this.failoverService.executeWithFailover(provider, async (p) =>
						RequestExecutor.execute(
							request,
							p,
							await this.getCredential(request.organizationId, p),
						),
					);
				response = result;
				actualProvider = usedProvider;
			} else {
				const credential = await this.getCredential(
					request.organizationId,
					provider,
				);
				response = await RequestExecutor.execute(request, provider, credential);
				actualProvider = provider;
			}

			this.recordMetrics(request, actualProvider, response, startTime, true);

			if (this.config.enableRateLimiting) {
				this.rateLimiter.increment(request.organizationId, actualProvider);
			}

			span.setAttribute("llm.response.id", response.id);
			span.setAttribute("llm.response.provider", actualProvider);
			span.setAttribute("llm.usage.prompt_tokens", response.usage.promptTokens);
			span.setAttribute(
				"llm.usage.completion_tokens",
				response.usage.completionTokens,
			);
			span.setAttribute("llm.usage.total_tokens", response.usage.totalTokens);
			span.end();

			// Track context usage if monitor is configured
			if (this.contextMonitor && runId && response.usage) {
				try {
					this.contextMonitor.trackRequest(runId, response.model, {
						promptTokens: response.usage.promptTokens,
						completionTokens: response.usage.completionTokens,
					});
				} catch (err) {
					loggers.ai.warn("ContextMonitor tracking failed", { error: err });
				}
			}

			return { ...response, provider: actualProvider };
		} catch (error) {
			const llmError = this.normalizeError(error, provider);
			this.recordMetrics(
				request,
				provider,
				undefined,
				startTime,
				false,
				llmError,
			);
			span.recordException(llmError);
			span.end({ error: true, "error.code": llmError.code });
			throw llmError;
		}
	}

	async *streamChat(
		request: AuthenticatedChatCompletionRequest,
		runId?: string,
	): AsyncGenerator<ChatCompletionStreamChunk> {
		const startTime = Date.now();
		const provider = this.routeToProvider(request);

		const span = llmGatewayTracer.startStreamSpan({
			"llm.request.id": `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
			"llm.request.model": request.model,
			"llm.request.provider": provider,
			"llm.request.organization_id": request.organizationId,
			"llm.request.user_id": request.userId,
		});

		if (this.config.enableRateLimiting) {
			const rateCheck = this.rateLimiter.check(
				request.organizationId,
				provider,
			);
			if (!rateCheck.allowed) {
				const error = new LLMGatewayError(
					"Rate limit exceeded",
					"RATE_LIMIT_EXCEEDED",
					provider,
					429,
				);
				span.recordException(error);
				span.end({ error: true, "error.code": error.code });
				throw error;
			}
		}

		// ── Budget enforcement: reject if daily/monthly budget exceeded ─────
		if (this.config.enableBudgetEnforcement) {
			await this.budgetEnforcer.require(request.organizationId);
		}

		try {
			const credential = await this.getCredential(
				request.organizationId,
				provider,
			);
			if (!credential) {
				const error = new LLMGatewayError(
					"No credentials available",
					"INVALID_API_KEY",
					provider,
					401,
				);
				span.recordException(error);
				span.end({ error: true, "error.code": error.code });
				throw error;
			}

			const stream = await StreamExecutor.execute(request, credential);

			// Track last chunk with usage for context monitoring (streaming)
			let lastUsage:
				| {
						promptTokens: number;
						completionTokens: number;
						totalTokens: number;
				  }
				| undefined;

			for await (const chunk of stream) {
				if (chunk.usage) {
					lastUsage = chunk.usage;
				}
				yield { ...chunk, provider };
			}

			// Track context usage if monitor is configured and we captured usage data
			if (this.contextMonitor && runId && lastUsage) {
				try {
					this.contextMonitor.trackRequest(runId, request.model, {
						promptTokens: lastUsage.promptTokens,
						completionTokens: lastUsage.completionTokens,
					});
				} catch (err) {
					loggers.ai.warn("ContextMonitor streaming tracking failed", {
						error: err,
					});
				}
			}

			if (this.config.enableRateLimiting) {
				this.rateLimiter.increment(request.organizationId, provider);
			}

			span.end();
		} catch (error) {
			const llmError = this.normalizeError(error, provider);
			this.recordMetrics(
				request,
				provider,
				undefined,
				startTime,
				false,
				llmError,
			);
			span.recordException(llmError);
			span.end({ error: true, "error.code": llmError.code });
			throw llmError;
		}
	}

	getHealthStatus() {
		return this.failoverService.getHealthStatus();
	}

	getRateLimitStatus(organizationId: number, provider: LLMProvider) {
		return this.rateLimiter.getStatus(organizationId, provider);
	}

	getMetrics(): RequestMetrics[] {
		return [...this.metrics];
	}

	clearMetrics(): void {
		this.metrics = [];
	}

	getCostAggregation(
		organizationId?: number,
		period: "hourly" | "daily" | "monthly" = "daily",
	): {
		totalCostUsd: number;
		costByProvider: Record<LLMProvider, number>;
		costByModel: Record<string, number>;
		totalTokens: number;
		requestCount: number;
		avgCostPerRequest: number;
	} {
		const filteredMetrics = organizationId
			? this.metrics.filter((m) => m.organizationId === organizationId)
			: this.metrics;
		return this.costTracker.aggregateCosts(filteredMetrics, period);
	}

	setFailoverChain(provider: LLMProvider, chain: FailoverChain): void {
		this.failoverService.setChain(provider, chain);
	}

	private async getCredential(
		_organizationId: number,
		provider: LLMProvider,
	): Promise<{ apiKey: string; baseUrl?: string } | null> {
		const envKeys: Record<LLMProvider, string | undefined> = {
			anthropic: process.env.ANTHROPIC_API_KEY,
			openai: process.env.OPENAI_API_KEY,
			google: process.env.GOOGLE_API_KEY,
			grok: process.env.GROK_API_KEY,
			deepseek: process.env.DEEPSEEK_API_KEY,
			openrouter: process.env.OPENROUTER_API_KEY,
			ollama: process.env.OLLAMA_API_KEY,
		};
		const key = envKeys[provider];
		if (!key) return null;
		return { apiKey: key };
	}

	private recordMetrics(
		request: AuthenticatedChatCompletionRequest,
		provider: LLMProvider,
		response: ChatCompletionResponse | undefined,
		startTime: number,
		success: boolean,
		error?: LLMGatewayError,
	): void {
		const latencyMs = Date.now() - startTime;
		const model = request.model ?? "unknown";
		const costResult = this.costTracker.calculate(
			model,
			provider,
			response?.usage.promptTokens ?? 0,
			response?.usage.completionTokens ?? 0,
		);

		const metric: RequestMetrics = {
			requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
			organizationId: request.organizationId,
			provider,
			model,
			success,
			latencyMs,
			promptTokens: response?.usage.promptTokens ?? 0,
			completionTokens: response?.usage.completionTokens ?? 0,
			totalTokens: response?.usage.totalTokens ?? 0,
			costUsd: costResult.costUsd,
			errorCode: error?.code,
		};

		this.metrics.push(metric);
		loggers.ai.info("LLM Gateway request", {
			requestId: metric.requestId,
			provider,
			model,
			latencyMs,
			success,
			tokens: metric.totalTokens,
			costUsd: metric.costUsd,
		});
	}

	private normalizeError(
		error: unknown,
		provider: LLMProvider,
	): LLMGatewayError {
		if (error instanceof LLMGatewayError) return error;
		const message = error instanceof Error ? error.message : "Unknown error";
		return new LLMGatewayError(message, "PROVIDER_ERROR", provider, 500);
	}
}

type AuthenticatedChatCompletionRequest = AuthenticatedChatRequest;

/**
 * Default gateway instance.
 */
export const llmGateway = new LLMGatewayService();
