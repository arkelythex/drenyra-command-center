/**
 * LLM Gateway Stream Executor — handles streaming chat requests.
 */
import { OllamaClient } from "../providers/ollama-client";
import {
	DEEPSEEK_BASE_URL,
	OPENROUTER_BASE_URL,
	OPENROUTER_HEADERS,
	PROVIDER_DEFAULT_MODELS,
} from "./gateway.constants";
import type {
	ChatCompletionRequest,
	ChatCompletionStreamChunk,
	LLMProvider,
} from "./types";
import { LLMGatewayError } from "./types";

export class StreamExecutor {
	static async execute(
		request: ChatCompletionRequest,
		credential: { apiKey: string; baseUrl?: string },
	): Promise<AsyncGenerator<ChatCompletionStreamChunk>> {
		const provider = request.provider ?? "openrouter";

		if (provider === "ollama") {
			const client = new OllamaClient({
				baseUrl: process.env.OLLAMA_BASE_URL,
				defaultModel: process.env.OLLAMA_DEFAULT_MODEL,
				apiKey: process.env.OLLAMA_API_KEY,
			});
			return client.streamChat(request);
		}

		if (provider === "deepseek") {
			return StreamExecutor.executeViaDeepSeek(request, credential);
		}

		return StreamExecutor.executeViaOpenRouter(request, provider, credential);
	}

	private static async executeViaOpenRouter(
		request: ChatCompletionRequest,
		provider: LLMProvider,
		_credential: { apiKey: string; baseUrl?: string },
	): Promise<AsyncGenerator<ChatCompletionStreamChunk>> {
		const apiKey =
			process.env.OPENROUTER_API_KEY ??
			process.env.ANTHROPIC_API_KEY ??
			process.env.OPENAI_API_KEY ??
			"";
		if (!apiKey) {
			throw new LLMGatewayError(
				"No API key configured",
				"INVALID_API_KEY",
				provider,
				401,
			);
		}

		const model = request.model ?? PROVIDER_DEFAULT_MODELS[provider];
		const response = await fetch(OPENROUTER_BASE_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				...OPENROUTER_HEADERS,
			},
			body: JSON.stringify({
				model,
				messages: request.messages,
				temperature: request.temperature,
				top_p: request.topP,
				max_tokens: request.maxTokens,
				stream: true,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new LLMGatewayError(
				`Provider API error: ${response.status}`,
				"PROVIDER_ERROR",
				provider,
				response.status,
				{ details: errorText },
			);
		}

		if (!response.body) {
			throw new LLMGatewayError(
				"No response body from provider",
				"GATEWAY_ERROR",
				provider,
				500,
			);
		}

		return StreamExecutor.createStreamGenerator(
			response.body.getReader(),
			provider,
			model,
		);
	}

	private static async executeViaDeepSeek(
		request: ChatCompletionRequest,
		credential: { apiKey: string; baseUrl?: string },
	): Promise<AsyncGenerator<ChatCompletionStreamChunk>> {
		const apiKey = credential?.apiKey ?? process.env.DEEPSEEK_API_KEY ?? "";
		if (!apiKey) {
			throw new LLMGatewayError(
				"No DeepSeek API key configured",
				"INVALID_API_KEY",
				"deepseek",
				401,
			);
		}

		const model = request.model ?? PROVIDER_DEFAULT_MODELS.deepseek;
		const response = await fetch(DEEPSEEK_BASE_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: request.messages,
				temperature: request.temperature,
				top_p: request.topP,
				max_tokens: request.maxTokens,
				stream: true,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new LLMGatewayError(
				`DeepSeek API error: ${response.status}`,
				"PROVIDER_ERROR",
				"deepseek",
				response.status,
				{ details: errorText },
			);
		}

		if (!response.body) {
			throw new LLMGatewayError(
				"No response body from DeepSeek",
				"GATEWAY_ERROR",
				"deepseek",
				500,
			);
		}

		return StreamExecutor.createStreamGenerator(
			response.body.getReader(),
			"deepseek",
			model,
		);
	}

	private static async *createStreamGenerator(
		reader: ReadableStreamDefaultReader<Uint8Array>,
		provider: LLMProvider,
		model: string,
	): AsyncGenerator<ChatCompletionStreamChunk> {
		const decoder = new TextDecoder();

		while (true) {
			try {
				const { done, value } = await reader.read();
				if (done) break;

				const text = decoder.decode(value, { stream: true });
				const lines = text.split("\n").filter((line) => line.trim() !== "");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = line.slice(6);
						if (data === "[DONE]") return;

						try {
							const parsed = JSON.parse(data);
							yield {
								id: parsed.id ?? "",
								object: "chat.completion.chunk",
								created: parsed.created ?? Date.now(),
								model: parsed.model ?? model,
								provider,
								choices:
									parsed.choices?.map(
										(c: {
											index?: number;
											delta?: { content?: string; role?: string };
											finish_reason?: string;
										}) => ({
											index: c.index ?? 0,
											delta: {
												content: c.delta?.content ?? "",
												role: c.delta?.role ?? "assistant",
											},
											finishReason: c.finish_reason ?? null,
										}),
									) ?? [],
							};
						} catch {
							// Skip invalid JSON
						}
					}
				}
			} catch (error) {
				throw new LLMGatewayError(
					`Stream error: ${error instanceof Error ? error.message : "Unknown"}`,
					"GATEWAY_ERROR",
					provider,
					500,
				);
			}
		}
	}
}
