import type {
	ModelCapability,
	ProviderName,
} from "@drenyra/ai/providers/model-router-types";

export interface ProviderRequest {
	prompt: string;
	systemPrompt?: string;
	maxTokens?: number;
	temperature?: number;
	capability: ModelCapability;
}

export interface ProviderResponse {
	content: string;
	modelName: string;
	latencyMs: number;
	inputTokens: number;
	outputTokens: number;
	costCents: number;
	raw?: unknown;
}

export interface ProviderHealth {
	status: "healthy" | "degraded" | "down";
	latencyMs: number;
	errorRate: number;
	lastCheckedAt: Date;
}

export interface ProviderAdapter {
	readonly providerName: ProviderName;
	readonly modelName: string;

	sendRequest(request: ProviderRequest): Promise<ProviderResponse>;
	validateResponse(response: ProviderResponse): boolean;
	checkHealth(): Promise<ProviderHealth>;
	getCost(inputTokens: number, outputTokens: number): number;
}

export interface ProviderAdapterFactory {
	createAdapter(modelId: string, modelName: string): ProviderAdapter;
}
