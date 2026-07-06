/** Capability for AI model routing. */
export type ModelCapability = string;

/** Registration entry for an AI model. */
export interface ModelRegistration {
	id: string;
	providerName: string;
	modelName: string;
	displayName?: string;
	capabilities: string[];
	status?: string;
	priority?: number;
	costPer1KInput?: number;
	costPer1KOutput?: number;
	maxTokens?: number;
	avgLatencyMs?: number;
	reliability?: number;
	metadata?: Record<string, unknown>;
	healthProbeUrl?: string;
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

/** Routing rule for a specific capability. */
export interface CapabilityRoutingRule {
	id: string;
	capability: string;
	strategy?: string;
	allowedModelIds?: string[];
	excludedModelIds?: string[];
	maxRetries?: number;
	costCapCents?: number;
	latencyCapMs?: number;
	minReliability?: number;
	requiresAudit?: boolean;
	fallbackStrategy?: string;
	metadata?: Record<string, unknown>;
	createdAt?: Date;
	updatedAt?: Date;
}

/** Result of a model routing decision. */
export interface RoutingResult {
	requestId: string;
	capability: string;
	selectedModelId?: string;
	selectedModel?: string;
	providerName: string;
	modelName: string;
	strategy: string;
	latencyMs?: number;
	costCents?: number;
	success: boolean;
	fallbackAttempted?: boolean;
	attemptNumber?: number;
	errorMessage?: string;
	createdAt?: Date;
}

export interface ModelFilters {
	status?: string;
	providerName?: string;
	capability?: ModelCapability;
	minReliability?: number;
}

export interface CapabilityScoringParams {
	maxCostCents?: number;
	maxLatencyMs?: number;
	minReliability?: number;
	preferredProviders?: string[];
}

export interface ModelRegistrationRepository {
	save(model: ModelRegistration): Promise<ModelRegistration>;
	update(model: ModelRegistration): Promise<ModelRegistration>;
	findById(id: string): Promise<ModelRegistration | null>;
	findAll(filters?: ModelFilters): Promise<ModelRegistration[]>;
	findByCapability(capability: ModelCapability): Promise<ModelRegistration[]>;
	findOptimalForCapability(
		capability: ModelCapability,
		scoring: CapabilityScoringParams,
	): Promise<ModelRegistration | null>;
	delete(id: string): Promise<void>;
}

export interface CapabilityRoutingRuleRepository {
	save(rule: CapabilityRoutingRule): Promise<CapabilityRoutingRule>;
	findByCapability(
		capability: ModelCapability,
	): Promise<CapabilityRoutingRule | null>;
	findAll(): Promise<CapabilityRoutingRule[]>;
	delete(id: string): Promise<void>;
}

export interface RoutingAuditLogRepository {
	save(entry: RoutingResult): Promise<void>;
	findByRequestId(requestId: string): Promise<RoutingResult[]>;
	findByCapability(
		capability: ModelCapability,
		since: Date,
	): Promise<RoutingResult[]>;
}
