/**
 * LLM Gateway SDK — Main SDK Client.
 * Provides a simple, type-safe interface for interacting with the Multi-Provider LLM Gateway.
 * Split from 694 lines → 4 modules (builder, http-client, helpers, sdk facade).
 */
import type { CostAggregation } from "./cost-tracker";
import type { LLMGatewayConfig, LLMGatewayService } from "./gateway.service";
import { llmGateway } from "./gateway.service";
import { ChatRequestBuilder } from "./sdk.builder";
import {
	assistantMessage,
	createMessage,
	extractStreamText,
	extractText,
	isLLMGatewayError,
	systemMessage,
	toolMessage,
	userMessage,
} from "./sdk.helpers";
import { GatewayHttpClient } from "./sdk.http-client";
import {
	type ChatCompletionRequest,
	type ChatCompletionResponse,
	type ChatCompletionStreamChunk,
	type ChatMessage,
	type ChatTool,
	LLM_PROVIDER,
	LLMGatewayError,
	type LLMProvider,
	MESSAGE_ROLE,
	type MessageRole,
	type RateLimitStatus,
	REQUEST_PRIORITY,
	type RequestMetrics,
	type RequestPriority,
} from "./types";

export interface LLMGatewaySDKConfig {
	baseUrl?: string;
	apiKey?: string;
	organizationId?: number;
	userId?: string;
	defaultProvider?: LLMProvider;
	enableFailover?: boolean;
	enableRateLimiting?: boolean;
	timeout?: number;
	mode?: "direct" | "http";
}

const DEFAULT_SDK_CONFIG: Required<LLMGatewaySDKConfig> = {
	baseUrl: "http://localhost:3000",
	apiKey: "",
	organizationId: 0,
	userId: "",
	defaultProvider: LLM_PROVIDER.OPENROUTER,
	enableFailover: true,
	enableRateLimiting: true,
	timeout: 120000,
	mode: "direct",
};

export class LLMGatewaySDK {
	private config: Required<LLMGatewaySDKConfig>;
	private gatewayService: LLMGatewayService;
	private httpClient: GatewayHttpClient | null;

	constructor(config: LLMGatewaySDKConfig, gatewayService?: LLMGatewayService) {
		this.config = { ...DEFAULT_SDK_CONFIG, ...config };
		this.gatewayService = gatewayService ?? llmGateway;
		this.httpClient =
			this.config.mode === "http"
				? new GatewayHttpClient(
						this.config.baseUrl,
						this.config.apiKey,
						this.config.organizationId,
						this.config.userId,
						this.config.timeout,
					)
				: null;
	}

	createRequest(model: string, provider?: LLMProvider): ChatRequestBuilder {
		return new ChatRequestBuilder(
			model,
			this.config.organizationId,
			this.config.userId,
			provider ?? this.config.defaultProvider,
		);
	}

	async chat(
		model: string,
		messages: ChatMessage[],
		options?: Partial<ChatCompletionRequest>,
	): Promise<ChatCompletionResponse> {
		if (this.config.mode === "http" && this.httpClient) {
			return this.httpClient.chat(model, messages, options);
		}
		return this.gatewayService.chat({
			...options,
			model,
			messages,
			organizationId: this.config.organizationId,
			userId: this.config.userId,
		} as Parameters<typeof this.gatewayService.chat>[0]);
	}

	async *streamChat(
		model: string,
		messages: ChatMessage[],
		options?: Partial<ChatCompletionRequest>,
	): AsyncGenerator<ChatCompletionStreamChunk> {
		if (this.config.mode === "http" && this.httpClient) {
			yield* this.httpClient.streamChat(model, messages, options);
		} else {
			const request = {
				...options,
				model,
				messages,
				organizationId: this.config.organizationId,
				userId: this.config.userId,
				stream: true,
			} as Parameters<typeof this.gatewayService.streamChat>[0];
			yield* this.gatewayService.streamChat(request);
		}
	}

	getHealthStatus() {
		return this.gatewayService.getHealthStatus();
	}
	getRateLimitStatus(provider?: LLMProvider) {
		return this.gatewayService.getRateLimitStatus(
			this.config.organizationId,
			provider ?? this.config.defaultProvider,
		);
	}
	getMetrics(): RequestMetrics[] {
		return this.gatewayService.getMetrics();
	}
	clearMetrics(): void {
		this.gatewayService.clearMetrics();
	}
	getCostAggregation(period: "hourly" | "daily" | "monthly" = "daily") {
		return this.gatewayService.getCostAggregation(
			this.config.organizationId,
			period,
		);
	}
	updateConfig(config: Partial<LLMGatewaySDKConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

export function createLLMGatewaySDK(
	config: LLMGatewaySDKConfig,
	gatewayService?: LLMGatewayService,
): LLMGatewaySDK {
	return new LLMGatewaySDK(config, gatewayService);
}

export function createHTTPGatewaySDK(
	baseUrl: string,
	apiKey: string,
	organizationId: number,
	userId: string,
): LLMGatewaySDK {
	return new LLMGatewaySDK({
		mode: "http",
		baseUrl,
		apiKey,
		organizationId,
		userId,
	});
}

export function createDirectGatewaySDK(
	organizationId: number,
	userId: string,
	gatewayService?: LLMGatewayService,
): LLMGatewaySDK {
	return new LLMGatewaySDK(
		{ mode: "direct", organizationId, userId },
		gatewayService,
	);
}

export {
	assistantMessage,
	type ChatCompletionRequest,
	type ChatCompletionResponse,
	type ChatCompletionStreamChunk,
	type ChatMessage,
	ChatRequestBuilder,
	type ChatTool,
	type CostAggregation,
	createMessage,
	extractStreamText,
	extractText,
	GatewayHttpClient,
	isLLMGatewayError,
	LLM_PROVIDER,
	type LLMGatewayConfig,
	LLMGatewayError,
	type LLMGatewayService,
	type LLMProvider,
	llmGateway,
	MESSAGE_ROLE,
	type MessageRole,
	type RateLimitStatus,
	REQUEST_PRIORITY,
	type RequestMetrics,
	type RequestPriority,
	systemMessage,
	toolMessage,
	userMessage,
};
