/**
 * LLM Gateway Request Executor — handles non-streaming chat requests to providers.
 */
import { OllamaClient } from "../providers/ollama-client";
import {
	DEEPSEEK_BASE_URL,
	OPENROUTER_BASE_URL,
	OPENROUTER_HEADERS,
	PROVIDER_DEFAULT_MODELS,
	STATUS_CODE_MAPPING,
} from "./gateway.constants";
import type {
	ChatCompletionRequest,
	ChatCompletionResponse,
	LLMErrorCode,
	LLMProvider,
} from "./types";
import { LLMGatewayError } from "./types";

export class RequestExecutor {
	static async execute(
		request: ChatCompletionRequest,
		provider: LLMProvider,
		credential: { apiKey: string; baseUrl?: string } | null,
	): Promise<ChatCompletionResponse> {
		if (provider === "ollama") {
			return RequestExecutor.executeOllama(request);
		}
		if (provider === "deepseek") {
			return RequestExecutor.executeViaDeepSeek(request, credential);
		}
		return RequestExecutor.executeViaOpenRouter(request, provider, credential);
	}

	private static async executeOllama(
		request: ChatCompletionRequest,
	): Promise<ChatCompletionResponse> {
		const client = new OllamaClient({
			...(process.env.OLLAMA_BASE_URL !== undefined
				? { baseUrl: process.env.OLLAMA_BASE_URL }
				: {}),
			...(process.env.OLLAMA_DEFAULT_MODEL !== undefined
				? { defaultModel: process.env.OLLAMA_DEFAULT_MODEL }
				: {}),
			...(process.env.OLLAMA_API_KEY !== undefined
				? { apiKey: process.env.OLLAMA_API_KEY }
				: {}),
		});
		return client.chat(request);
	}

	private static async executeViaOpenRouter(
		request: ChatCompletionRequest,
		provider: LLMProvider,
		credential: { apiKey: string; baseUrl?: string } | null,
	): Promise<ChatCompletionResponse> {
		const apiKey =
			credential?.apiKey ??
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
				stream: false,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new LLMGatewayError(
				`Provider API error: ${response.status}`,
				(STATUS_CODE_MAPPING[response.status] ??
					"PROVIDER_ERROR") as LLMErrorCode,
				provider,
				response.status,
				{ details: errorText },
			);
		}

		const data = await response.json();
		return {
			id: data.id,
			object: "chat.completion",
			created: data.created,
			model: data.model,
			provider,
			choices: data.choices,
			usage: {
				promptTokens: data.usage?.prompt_tokens ?? 0,
				completionTokens: data.usage?.completion_tokens ?? 0,
				totalTokens: data.usage?.total_tokens ?? 0,
			},
		};
	}

	private static async executeViaDeepSeek(
		request: ChatCompletionRequest,
		credential: { apiKey: string; baseUrl?: string } | null,
	): Promise<ChatCompletionResponse> {
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
				stream: false,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new LLMGatewayError(
				`DeepSeek API error: ${response.status}`,
				(STATUS_CODE_MAPPING[response.status] ??
					"PROVIDER_ERROR") as LLMErrorCode,
				"deepseek",
				response.status,
				{ details: errorText },
			);
		}

		const data = await response.json();
		return {
			id: data.id,
			object: "chat.completion",
			created: data.created,
			model: data.model,
			provider: "deepseek",
			choices: data.choices,
			usage: {
				promptTokens: data.usage?.prompt_tokens ?? 0,
				completionTokens: data.usage?.completion_tokens ?? 0,
				totalTokens: data.usage?.total_tokens ?? 0,
			},
		};
	}
}
