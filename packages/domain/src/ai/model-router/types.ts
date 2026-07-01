export type ModelCapability =
	| "OCR"
	| "CLASSIFICATION"
	| "EXTRACTION"
	| "ANALYSIS"
	| "RECONCILIATION"
	| "CODING"
	| "AUDIT"
	| "SUMMARIZATION"
	| "CHAT";

export type ProviderName =
	| "openai"
	| "anthropic"
	| "google"
	| "deepseek"
	| "openrouter";

export type RouterStrategy =
	| "capability_match"
	| "cost_optimal"
	| "latency_optimal"
	| "quality_preferred"
	| "fallback_chain";

export type ModelStatus = "ACTIVE" | "DEGRADED" | "OFFLINE" | "DEPRECATED";

export interface ModelRegistration {
	id: string;
	providerName: ProviderName;
	modelName: string;
	displayName: string;
	capabilities: ModelCapability[];
	status: ModelStatus;
	priority: number;
	costPer1KInput: number;
	costPer1KOutput: number;
	maxTokens: number;
	avgLatencyMs?: number;
	reliability?: number;
	metadata?: Record<string, unknown>;
	healthProbeUrl?: string;
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CapabilityRoutingRule {
	id: string;
	capability: ModelCapability;
	strategy: RouterStrategy;
	allowedModelIds: string[];
	excludedModelIds: string[];
	maxRetries: number;
	costCapCents?: number;
	latencyCapMs?: number;
	minReliability?: number;
	requiresAudit: boolean;
	fallbackStrategy: RouterStrategy;
	metadata?: Record<string, unknown>;
}

export interface RoutingResult {
	requestId: string;
	capability: ModelCapability;
	selectedModelId: string;
	providerName: ProviderName;
	modelName: string;
	strategy: RouterStrategy;
	latencyMs?: number;
	costCents?: number;
	success: boolean;
	fallbackAttempted?: boolean;
	attemptNumber: number;
	errorMessage?: string;
	responseContent?: string;
	timestamp: Date;
}

export interface ModelHealthProbe {
	modelId: string;
	status: ModelStatus;
	latencyMs: number;
	errorRate: number;
	lastSuccessAt?: Date;
	lastFailureAt?: Date;
	consecutiveFailures: number;
	checkedAt: Date;
}
