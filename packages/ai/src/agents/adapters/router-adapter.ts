import type { ModelCapability } from "@drenyra/ai";
import type { AdaptiveRouter } from "@drenyra/infrastructure/ai/model-router/router";
import { loggers } from "../../services/logger";
import type { AIResponse } from "../types";

export interface RouterAdapterOptions {
	capability: ModelCapability;
	systemPrompt?: string;
	maxTokens?: number;
	temperature?: number;
}

export class RouterAdapter {
	private requestCounter = 0;

	constructor(private readonly router: AdaptiveRouter) {}

	async callModel(
		prompt: string,
		options: RouterAdapterOptions,
	): Promise<AIResponse> {
		const startTime = Date.now();
		const requestId = this.nextRequestId();

		loggers.ai.info("RouterAdapter: routing request", {
			requestId,
			capability: options.capability,
		});

		const result = await this.router.route(
			requestId,
			options.capability,
			prompt,
			options.systemPrompt,
		);

		const latency = Date.now() - startTime;

		if (!result.success) {
			loggers.ai.error("RouterAdapter: routing failed", {
				requestId,
				error: result.errorMessage,
			});
			throw new Error(
				`Model routing failed: ${result.errorMessage ?? "unknown error"}`,
			);
		}

		loggers.ai.info("RouterAdapter: routing succeeded", {
			requestId,
			model: result.modelName,
			latency,
		});

		return {
			content: result.responseContent ?? "",
			tokensUsed: {
				input: 0,
				output: 0,
			},
			cost: (result.costCents ?? 0) / 100,
			latency,
			cached: false,
		};
	}

	async callModelWithRetry(
		prompt: string,
		options: RouterAdapterOptions & { maxRetries?: number },
	): Promise<AIResponse> {
		const maxAttempts = options.maxRetries ?? 3;
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await this.callModel(prompt, options);
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				loggers.ai.warn("RouterAdapter: retrying after failure", {
					attempt,
					maxAttempts,
					error: lastError.message,
				});

				if (attempt < maxAttempts) {
					const delayMs = Math.min(1000 * 2 ** (attempt - 1), 10000);
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				}
			}
		}

		throw lastError ?? new Error("Model routing failed after all retries");
	}

	private nextRequestId(): string {
		this.requestCounter++;
		return `router-${Date.now()}-${this.requestCounter}`;
	}
}
