import type { ProviderName } from "@arkelythex/domain/ai/model-router/types";
import type {
	ProviderAdapter,
	ProviderHealth,
	ProviderRequest,
	ProviderResponse,
} from "./provider-adapter.types";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Adapter for OpenRouter — wraps the existing OpenRouterService contract
 * with the ProviderAdapter interface. Uses the same API base and key pattern
 * as the existing infrastructure.
 */
export class OpenRouterAdapter implements ProviderAdapter {
	readonly providerName: ProviderName = "openrouter";

	constructor(
		readonly modelName: string,
		private readonly apiKey: string,
		private readonly baseUrl: string = OPENROUTER_BASE_URL,
	) {}

	async sendRequest(request: ProviderRequest): Promise<ProviderResponse> {
		const start = performance.now();
		const systemPrompt = request.systemPrompt ?? "";

		const response = await fetch(this.baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`,
				"HTTP-Referer": "https://drenyra.app",
				"X-Title": "Drenyra",
			},
			body: JSON.stringify({
				model: this.modelName,
				messages: [
					...(systemPrompt
						? [{ role: "system" as const, content: systemPrompt }]
						: []),
					{ role: "user" as const, content: request.prompt },
				],
				max_tokens: request.maxTokens ?? 4096,
				temperature: request.temperature ?? 0.3,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenRouter API error (${response.status}): ${error}`);
		}

		const data = (await response.json()) as {
			choices: { message: { content: string } }[];
			usage: { prompt_tokens: number; completion_tokens: number };
			model: string;
		};

		const latencyMs = Math.round(performance.now() - start);
		const inputTokens = data.usage.prompt_tokens;
		const outputTokens = data.usage.completion_tokens;

		return {
			content: data.choices[0].message.content,
			modelName: data.model,
			latencyMs,
			inputTokens,
			outputTokens,
			costCents: this.getCost(inputTokens, outputTokens),
			raw: data,
		};
	}

	validateResponse(response: ProviderResponse): boolean {
		return (
			typeof response.content === "string" &&
			response.content.length > 0 &&
			response.latencyMs > 0 &&
			response.inputTokens > 0
		);
	}

	async checkHealth(): Promise<ProviderHealth> {
		const start = performance.now();
		try {
			const response = await fetch(
				`${new URL(this.baseUrl).origin}/api/v1/auth/key`,
				{
					headers: { Authorization: `Bearer ${this.apiKey}` },
				},
			);
			const latencyMs = Math.round(performance.now() - start);
			return {
				status: response.ok ? "healthy" : "degraded",
				latencyMs,
				errorRate: response.ok ? 0 : 1,
				lastCheckedAt: new Date(),
			};
		} catch {
			return {
				status: "down",
				latencyMs: Math.round(performance.now() - start),
				errorRate: 1,
				lastCheckedAt: new Date(),
			};
		}
	}

	getCost(inputTokens: number, outputTokens: number): number {
		// OpenRouter aggregates provider costs; estimate mid-range
		const inputCost = (inputTokens / 1000) * 0.005;
		const outputCost = (outputTokens / 1000) * 0.015;
		return Math.round((inputCost + outputCost) * 100);
	}
}
