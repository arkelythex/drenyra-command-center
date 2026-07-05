import type { ProviderName } from "@drenyra/ai/providers/model-router-types";
import type {
	ProviderAdapter,
	ProviderHealth,
	ProviderRequest,
	ProviderResponse,
} from "./provider-adapter.types";

const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIAdapter implements ProviderAdapter {
	readonly providerName: ProviderName = "openai";

	constructor(
		readonly modelName: string,
		private readonly apiKey: string,
		private readonly baseUrl: string = OPENAI_BASE_URL,
	) {}

	async sendRequest(request: ProviderRequest): Promise<ProviderResponse> {
		const start = performance.now();

		const response = await fetch(this.baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				model: this.modelName,
				messages: [
					...(request.systemPrompt
						? [{ role: "system" as const, content: request.systemPrompt }]
						: []),
					{ role: "user" as const, content: request.prompt },
				],
				max_tokens: request.maxTokens,
				temperature: request.temperature ?? 0.3,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI API error (${response.status}): ${error}`);
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
			const response = await fetch(`${new URL(this.baseUrl).origin}/models`, {
				headers: { Authorization: `Bearer ${this.apiKey}` },
			});
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
		// Approximate cost: $0.01/1K input, $0.03/1K output for GPT-4 class
		const inputCost = (inputTokens / 1000) * 0.01;
		const outputCost = (outputTokens / 1000) * 0.03;
		return Math.round((inputCost + outputCost) * 100); // cents
	}
}
