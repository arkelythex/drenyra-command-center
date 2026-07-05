/**
 * Ollama Local Provider Client
 *
 * Client for interacting with locally-hosted Ollama instances.
 * Uses Ollama's OpenAI-compatible `/v1/chat/completions` endpoint
 * for chat completions and `/api/tags` for health/model discovery.
 *
 * @module @drenyra/ai/providers/ollama
 */

import type {
	ChatCompletionRequest,
	ChatCompletionResponse,
	ChatCompletionStreamChunk,
	OllamaConfig,
	OllamaModelList,
} from "../gateway/types";
import { LLMGatewayError } from "../gateway/types";

/**
 * Default configuration for Ollama client.
 */
const DEFAULT_CONFIG: OllamaConfig = {
	baseUrl: "http://localhost:11434",
	defaultModel: "llama3",
};

/**
 * Ollama Local Provider Client.
 *
 * Provides methods for chat completions, streaming, health checks,
 * and model discovery against a locally-hosted Ollama instance.
 *
 * @example
 * ```typescript
 * const client = new OllamaClient({
 *   baseUrl: 'http://localhost:11434',
 *   defaultModel: 'llama3',
 * });
 *
 * // Check health
 * const health = await client.healthCheck();
 *
 * // List available models
 * const models = await client.listModels();
 *
 * // Chat completion
 * const response = await client.chat({
 *   model: 'llama3',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export class OllamaClient {
	private config: OllamaConfig;

	constructor(config?: Partial<OllamaConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.validateConfig();
	}

	/**
	 * Validate configuration at construction time.
	 */
	private validateConfig(): void {
		try {
			new URL(this.config.baseUrl);
		} catch {
			throw new LLMGatewayError(
				`Invalid Ollama base URL: ${this.config.baseUrl}`,
				"BAD_REQUEST",
				"ollama",
				400,
			);
		}
	}

	/**
	 * Get the base URL, ensuring no trailing slash.
	 */
	private get baseUrl(): string {
		return this.config.baseUrl.replace(/\/+$/, "");
	}

	/**
	 * List available models from Ollama.
	 *
	 * Calls the `/api/tags` endpoint to retrieve all locally
	 * installed models.
	 *
	 * @returns Promise resolving to the model list response
	 * @throws LLMGatewayError with PROVIDER_UNAVAILABLE if Ollama is unreachable
	 */
	async listModels(): Promise<OllamaModelList> {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`, {
				method: "GET",
				headers: this.buildHeaders(),
				signal: AbortSignal.timeout(10000),
			});

			if (!response.ok) {
				throw new LLMGatewayError(
					`Failed to list models: ${response.status}`,
					"PROVIDER_ERROR",
					"ollama",
					response.status,
				);
			}

			const data = await response.json();
			return {
				models: Array.isArray(data.models)
					? data.models.map(
							(m: { name: string; modified_at: string; size: number }) => ({
								name: m.name,
								modified_at: m.modified_at,
								size: m.size,
							}),
						)
					: [],
			};
		} catch (error) {
			if (error instanceof LLMGatewayError) {
				throw error;
			}
			throw new LLMGatewayError(
				`Failed to connect to Ollama: ${error instanceof Error ? error.message : "Unknown error"}`,
				"PROVIDER_UNAVAILABLE",
				"ollama",
				503,
			);
		}
	}

	/**
	 * Check if Ollama service is healthy and available.
	 *
	 * Calls the `/api/tags` endpoint to verify connectivity and
	 * retrieve the list of available models.
	 *
	 * @returns Health status object with model list if healthy
	 */
	async healthCheck(): Promise<{
		healthy: boolean;
		models?: string[];
		error?: string;
	}> {
		try {
			const modelList = await this.listModels();
			return {
				healthy: true,
				models: modelList.models.map((m) => m.name),
			};
		} catch (error) {
			return {
				healthy: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Send a chat completion request (non-streaming).
	 *
	 * Uses Ollama's OpenAI-compatible `/v1/chat/completions` endpoint.
	 *
	 * @param request - Chat completion request
	 * @returns Promise resolving to the chat completion response
	 * @throws LLMGatewayError with INVALID_MODEL if model not available
	 * @throws LLMGatewayError with PROVIDER_UNAVAILABLE if Ollama is unreachable
	 */
	async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
		const model = request.model || this.config.defaultModel;

		// Validate model is available before sending
		await this.validateModel(model);

		try {
			const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
				method: "POST",
				headers: this.buildHeaders(),
				body: JSON.stringify({
					model,
					messages: request.messages,
					temperature: request.temperature,
					top_p: request.topP,
					max_tokens: request.maxTokens,
					stop: request.stop,
					stream: false,
				}),
				signal: AbortSignal.timeout(120000),
			});

			if (!response.ok) {
				const errorText = await response.text();
				if (response.status === 404) {
					throw new LLMGatewayError(
						`Model '${model}' not found in Ollama`,
						"INVALID_MODEL",
						"ollama",
						404,
						{ details: errorText },
					);
				}
				throw new LLMGatewayError(
					`Ollama API error: ${response.status}`,
					"PROVIDER_ERROR",
					"ollama",
					response.status,
					{ details: errorText },
				);
			}

			const data = await response.json();

			return {
				id: data.id ?? `ollama_${Date.now()}`,
				object: "chat.completion",
				created: data.created ?? Math.floor(Date.now() / 1000),
				model: data.model ?? model,
				provider: "ollama",
				choices: (data.choices ?? []).map(
					(c: {
						index: number;
						message: { role: string; content: string };
						finish_reason?: string;
					}) => ({
						index: c.index ?? 0,
						message: {
							role: c.message?.role ?? "assistant",
							content: c.message?.content ?? "",
						},
						finishReason:
							(c.finish_reason as
								| "stop"
								| "length"
								| "content_filter"
								| "tool_calls"
								| null) ?? "stop",
					}),
				),
				usage: {
					promptTokens: data.usage?.prompt_tokens ?? 0,
					completionTokens: data.usage?.completion_tokens ?? 0,
					totalTokens: data.usage?.total_tokens ?? 0,
				},
			};
		} catch (error) {
			if (error instanceof LLMGatewayError) {
				throw error;
			}
			throw new LLMGatewayError(
				`Failed to connect to Ollama: ${error instanceof Error ? error.message : "Unknown error"}`,
				"PROVIDER_UNAVAILABLE",
				"ollama",
				503,
			);
		}
	}

	/**
	 * Send a streaming chat completion request.
	 *
	 * Uses Ollama's OpenAI-compatible `/v1/chat/completions` endpoint
	 * with streaming enabled. Handles both OpenAI-style SSE format
	 * and Ollama's native `done: true` format.
	 *
	 * @param request - Chat completion request with stream: true
	 * @returns AsyncGenerator yielding stream chunks
	 */
	async *streamChat(
		request: ChatCompletionRequest,
	): AsyncGenerator<ChatCompletionStreamChunk> {
		const model = request.model || this.config.defaultModel;

		// Validate model is available before sending
		await this.validateModel(model);

		try {
			const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
				method: "POST",
				headers: this.buildHeaders(),
				body: JSON.stringify({
					model,
					messages: request.messages,
					temperature: request.temperature,
					top_p: request.topP,
					max_tokens: request.maxTokens,
					stop: request.stop,
					stream: true,
				}),
				signal: AbortSignal.timeout(120000),
			});

			if (!response.ok) {
				const errorText = await response.text();
				if (response.status === 404) {
					throw new LLMGatewayError(
						`Model '${model}' not found in Ollama`,
						"INVALID_MODEL",
						"ollama",
						404,
						{ details: errorText },
					);
				}
				throw new LLMGatewayError(
					`Ollama API error: ${response.status}`,
					"PROVIDER_ERROR",
					"ollama",
					response.status,
					{ details: errorText },
				);
			}

			if (!response.body) {
				throw new LLMGatewayError(
					"No response body from Ollama",
					"GATEWAY_ERROR",
					"ollama",
					500,
				);
			}

			const decoder = new TextDecoder();
			const reader = response.body.getReader();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const text = decoder.decode(value, { stream: true });
				const lines = text.split("\n").filter((line) => line.trim() !== "");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = line.slice(6);
						if (data === "[DONE]") {
							return;
						}

						try {
							const parsed = JSON.parse(data);

							// Handle Ollama's native format with `done: true`
							if (parsed.done === true) {
								return;
							}

							const chunk: ChatCompletionStreamChunk = {
								id: parsed.id ?? `ollama_${Date.now()}`,
								object: "chat.completion.chunk",
								created: parsed.created ?? Math.floor(Date.now() / 1000),
								model: parsed.model ?? model,
								provider: "ollama",
								choices:
									parsed.choices?.map(
										(c: {
											index: number;
											delta: { content?: string; role?: string };
											finish_reason?: string;
										}) => ({
											index: c.index ?? 0,
											delta: {
												content: c.delta?.content ?? "",
												role: (c.delta?.role ?? "assistant") as
													| "system"
													| "user"
													| "assistant"
													| "tool",
											},
											finishReason: c.finish_reason ?? null,
										}),
									) ?? [],
							};

							// Include usage if available (typically in the last chunk)
							if (parsed.usage) {
								chunk.usage = {
									promptTokens: parsed.usage.prompt_tokens ?? 0,
									completionTokens: parsed.usage.completion_tokens ?? 0,
									totalTokens: parsed.usage.total_tokens ?? 0,
								};
							}

							yield chunk;
						} catch {
							// Skip invalid JSON lines
						}
					}
				}
			}
		} catch (error) {
			if (error instanceof LLMGatewayError) {
				throw error;
			}
			throw new LLMGatewayError(
				`Stream error: ${error instanceof Error ? error.message : "Unknown error"}`,
				"GATEWAY_ERROR",
				"ollama",
				500,
			);
		}
	}

	/**
	 * Validate that a model is available in Ollama.
	 *
	 * @param model - Model name to validate
	 * @throws LLMGatewayError with INVALID_MODEL if not available
	 */
	private async validateModel(model: string): Promise<void> {
		const modelList = await this.listModels();
		const available = modelList.models.map((m) => m.name);

		// Check exact match or prefix match (Ollama models can have tags like "llama3:8b")
		const found = available.some(
			(m) => m === model || m.startsWith(`${model}:`),
		);

		if (!found) {
			throw new LLMGatewayError(
				`Model '${model}' is not installed in Ollama. Available models: ${available.join(", ") || "none"}`,
				"INVALID_MODEL",
				"ollama",
				404,
			);
		}
	}

	/**
	 * Build headers for Ollama API requests.
	 */
	private buildHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (this.config.apiKey) {
			headers["Authorization"] = `Bearer ${this.config.apiKey}`;
		}

		return headers;
	}
}
