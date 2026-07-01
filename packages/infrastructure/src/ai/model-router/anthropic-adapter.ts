import type { ProviderName } from "@arkelythex/domain/ai/model-router/types";
import type {
	ProviderAdapter,
	ProviderHealth,
	ProviderRequest,
	ProviderResponse,
} from "./provider-adapter.types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicAdapter implements ProviderAdapter {
	readonly providerName: ProviderName = "anthropic";

	constructor(
		readonly modelName: string,
		private readonly apiKey: string,
		private readonly baseUrl: string = ANTHROPIC_BASE_URL,
	) {}

	async sendRequest(request: ProviderRequest): Promise<ProviderResponse> {
		const start = performance.now();

		const response = await fetch(this.baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: this.modelName,
				system: request.systemPrompt,
				messages: [{ role: "user", content: request.prompt }],
				max_tokens: request.maxTokens ?? 4096,
				temperature: request.temperature ?? 0.3,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Anthropic API error (${response.status}): ${error}`);
		}

		const data = (await response.json()) as {
			content: { text: string }[];
			usage: { input_tokens: number; output_tokens: number };
			model: string;
		};

		const latencyMs = Math.round(performance.now() - start);
		const inputTokens = data.usage.input_tokens;
		const outputTokens = data.usage.output_tokens;

		return {
			content: data.content[0]?.text ?? "",
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
			const response = await fetch(this.baseUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.apiKey,
					"anthropic-version": "2023-06-01",
				},
				body: JSON.stringify({
					model: "claude-instant-1.2",
					max_tokens: 1,
					messages: [{ role: "user", content: "ping" }],
				}),
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
		const inputCost = (inputTokens / 1000) * 0.008;
		const outputCost = (outputTokens / 1000) * 0.024;
		return Math.round((inputCost + outputCost) * 100);
	}
}
