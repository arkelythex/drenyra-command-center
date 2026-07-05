/**
 * OpenRouter Integration - DRENYRA 2026
 *
 * Unified LLM API integration for multi-agent system
 * Access to 300+ models from 60+ providers with single API key
 *
 * Features:
 * - Model routing (auto & manual)
 * - Provider fallback management
 * - Cost tracking and budgeting
 * - Multi-model workflows
 *
 * @since 2026.1.0
 */

import { loggers } from "../../../logger.js";

import type {
	CostMetrics,
	OpenRouterConfig,
	OpenRouterMessage,
	OpenRouterModel,
	OpenRouterRequest,
	OpenRouterResponse,
	OpenRouterTool,
	StreamChunk,
} from "./types.js";

import { AGENT_MODEL_MAP } from "./types.js";

export class OpenRouterService {
	private config: OpenRouterConfig;
	private costTracker: CostTracker;
	private modelCache: Map<string, OpenRouterModel> = new Map();
	private lastFetch: Date | null = null;

	constructor(config: OpenRouterConfig) {
		this.config = {
			baseUrl: "https://openrouter.ai/api/v1",
			timeout: 60000,
			maxRetries: 3,
			enableAutoRouting: true,
			...config,
		};
		this.costTracker = new CostTracker(config.budgetLimit || 1000);
	}

	async chatCompletion(
		request: OpenRouterRequest,
	): Promise<OpenRouterResponse> {
		const startTime = Date.now();
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
			try {
				const response = await this.makeRequest(request);

				this.costTracker.trackRequest(
					response.model,
					response.usage.prompt_tokens,
					response.usage.completion_tokens,
					response.usage.cost,
				);

				loggers.ai.info("OpenRouter request successful", {
					model: response.model,
					tokens: response.usage.total_tokens,
					cost: response.usage.cost,
					duration: Date.now() - startTime,
				});

				return response;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				if (request.models && request.models.length > attempt + 1) {
					request.model = request.models[attempt + 1];
					loggers.ai.warn(`Fallback to model: ${request.model}`, {
						previousError: lastError.message,
						attempt: attempt + 1,
					});
					continue;
				}

				if (attempt < (this.config.maxRetries || 3) - 1) {
					await this.sleep(2 ** attempt * 1000);
				}
			}
		}

		throw lastError || new Error("All retries failed");
	}

	async *chatCompletionStream(
		request: OpenRouterRequest,
	): AsyncGenerator<StreamChunk> {
		const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify({ ...request, stream: true }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`OpenRouter streaming failed: ${response.status} - ${errorText}`,
			);
		}

		if (!response.body) {
			throw new Error("Response body is null");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let currentModel = request.model;
		const toolCallIdByIndex = new Map<number, string>();

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed || trimmed === "data: [DONE]") continue;
					if (!trimmed.startsWith("data: ")) continue;

					try {
						const json = JSON.parse(trimmed.slice(6));
						const delta = json.choices?.[0]?.delta;
						const choice = json.choices?.[0];

						if (json.error) {
							const message =
								typeof json.error?.message === "string"
									? json.error.message
									: "Unknown OpenRouter streaming error";
							throw new Error(`OpenRouter stream error: ${message}`);
						}

						if (json.model) {
							currentModel = json.model;
						}

						if (delta?.content) {
							yield { type: "token", content: delta.content };
						}

						if (delta?.tool_calls) {
							for (const tc of delta.tool_calls) {
								const index = typeof tc.index === "number" ? tc.index : 0;
								const resolvedId =
									tc.id ??
									toolCallIdByIndex.get(index) ??
									`tool_call_${index}_${Date.now()}`;
								toolCallIdByIndex.set(index, resolvedId);

								if (tc.function?.name) {
									yield {
										type: "tool_call_start",
										id: resolvedId,
										name: tc.function.name,
									};
								}
								if (tc.function?.arguments) {
									yield {
										type: "tool_call_delta",
										id: resolvedId,
										arguments: tc.function.arguments,
									};
								}
							}
						}

						if (choice?.finish_reason) {
							if (json.usage) {
								const cost = this.calculateCostFromUsage(
									currentModel,
									json.usage,
								);

								this.costTracker.trackRequest(
									currentModel,
									json.usage.prompt_tokens,
									json.usage.completion_tokens,
									cost,
								);

								yield {
									type: "usage",
									usage: {
										prompt_tokens: json.usage.prompt_tokens,
										completion_tokens: json.usage.completion_tokens,
										total_tokens: json.usage.total_tokens,
										cost,
									},
								};
							}

							yield { type: "done", finish_reason: choice.finish_reason };
						}
					} catch (parseError) {
						loggers.ai.warn("Failed to parse SSE chunk", {
							line: trimmed,
							error: parseError,
						});
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}

	private calculateCostFromUsage(
		model: string,
		usage: { prompt_tokens: number; completion_tokens: number },
	): number {
		const modelInfo = this.modelCache.get(model);
		if (!modelInfo) {
			return (
				(usage.prompt_tokens / 1000) * 0.001 +
				(usage.completion_tokens / 1000) * 0.002
			);
		}

		const promptCost = (usage.prompt_tokens / 1000) * modelInfo.pricing.prompt;
		const completionCost =
			(usage.completion_tokens / 1000) * modelInfo.pricing.completion;
		return promptCost + completionCost;
	}

	async executeAgentTask(
		agentId: string,
		systemPrompt: string,
		userPrompt: string,
		tools?: OpenRouterTool[],
	): Promise<OpenRouterResponse> {
		const models = AGENT_MODEL_MAP[agentId] || AGENT_MODEL_MAP["default"];

		const request: OpenRouterRequest = {
			model: this.config.enableAutoRouting ? "openrouter/auto" : models[0],
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			models: this.config.enableAutoRouting ? undefined : models,
			provider: {
				allow_fallbacks: true,
				sort: "price",
				only: this.config.preferredProviders,
				ignore: this.config.excludedProviders,
			},
			...(tools && { tools, tool_choice: "auto" }),
		};

		return this.chatCompletion(request);
	}

	private getHeaders(): HeadersInit {
		return {
			Authorization: `Bearer ${this.config.apiKey}`,
			"Content-Type": "application/json",
			"HTTP-Referer": "https://drenyra.io",
			"X-Title": "DRENYRA Fiscal Platform",
		};
	}

	private async makeRequest(
		request: OpenRouterRequest,
	): Promise<OpenRouterResponse> {
		const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
		}

		return response.json();
	}

	async fetchModels(): Promise<OpenRouterModel[]> {
		if (this.lastFetch && Date.now() - this.lastFetch.getTime() < 3600000) {
			return Array.from(this.modelCache.values());
		}

		const response = await fetch(`${this.config.baseUrl}/models`, {
			headers: {
				Authorization: `Bearer ${this.config.apiKey}`,
			},
		});

		if (!response.ok) {
			throw new Error("Failed to fetch models");
		}

		const data = await response.json();
		const models: OpenRouterModel[] = data.data;

		this.modelCache.clear();
		models.forEach((model) => this.modelCache.set(model.id, model));
		this.lastFetch = new Date();

		return models;
	}

	async getModel(modelId: string): Promise<OpenRouterModel | undefined> {
		if (this.modelCache.has(modelId)) {
			return this.modelCache.get(modelId);
		}

		await this.fetchModels();
		return this.modelCache.get(modelId);
	}

	getCostMetrics(): CostMetrics {
		return this.costTracker.getMetrics();
	}

	isWithinBudget(): boolean {
		return this.costTracker.isWithinBudget();
	}

	getRecommendedModel(taskType: string): string {
		const recommendations: Record<string, string> = {
			"code-generation": "anthropic/claude-opus-4.5",
			"code-review": "anthropic/claude-sonnet-4.5",
			documentation: "anthropic/claude-sonnet-4.5",
			analysis: "openai/gpt-5.1",
			chat: "openrouter/auto",
			creative: "google/gemini-3-pro-preview",
		};

		return recommendations[taskType] || "openrouter/auto";
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

class CostTracker {
	private totalRequests = 0;
	private totalTokens = 0;
	private totalCost = 0;
	private modelBreakdown = new Map<
		string,
		{ requests: number; tokens: number; cost: number }
	>();
	private providerBreakdown = new Map<
		string,
		{ requests: number; cost: number }
	>();

	constructor(private monthlyBudget: number) {}

	trackRequest(
		model: string,
		promptTokens: number,
		completionTokens: number,
		cost: number,
	): void {
		this.totalRequests++;
		this.totalTokens += promptTokens + completionTokens;
		this.totalCost += cost;

		const modelStats = this.modelBreakdown.get(model) || {
			requests: 0,
			tokens: 0,
			cost: 0,
		};
		modelStats.requests++;
		modelStats.tokens += promptTokens + completionTokens;
		modelStats.cost += cost;
		this.modelBreakdown.set(model, modelStats);

		const provider = model.split("/")[0];
		const providerStats = this.providerBreakdown.get(provider) || {
			requests: 0,
			cost: 0,
		};
		providerStats.requests++;
		providerStats.cost += cost;
		this.providerBreakdown.set(provider, providerStats);
	}

	getMetrics(): CostMetrics {
		return {
			totalRequests: this.totalRequests,
			totalTokens: this.totalTokens,
			totalCost: this.totalCost,
			monthlyBudget: this.monthlyBudget,
			budgetRemaining: this.monthlyBudget - this.totalCost,
			modelBreakdown: new Map(this.modelBreakdown),
			providerBreakdown: new Map(this.providerBreakdown),
		};
	}

	isWithinBudget(): boolean {
		return this.totalCost < this.monthlyBudget;
	}
}
