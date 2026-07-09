/**
 * Domain-level model capability types (simplified).
 * Rich provider-specific types live in @drenyra/ai.
 */

/** Supported model capability categories */
export type ModelCapability =
	| "text-generation"
	| "code-generation"
	| "reasoning"
	| "classification"
	| "extraction"
	| "embedding"
	| "ocr"
	| "analysis"
	| "reconciliation"
	| "chat";

/** Simplified model registration for domain repositories */
export interface ModelRegistration {
	id: string;
	modelId?: string;
	provider?: string;
	capabilities: ModelCapability[];
	status: "active" | "inactive" | "deprecated";
	costPerToken?: number;
	latencyMs?: number;
	reliability?: number;
}

/** Simplified routing rule for domain repositories */
export interface CapabilityRoutingRule {
	id: string;
	capability: ModelCapability;
	priority: number;
	modelId: string;
	provider: string;
	fallbackModelId?: string;
	minReliability?: number;
}

/** Simplified routing result for domain audit logs */
export interface RoutingResult {
	requestId: string;
	capability: ModelCapability;
	selectedModelId: string;
	selectedProvider: string;
	timestamp: Date;
	success: boolean;
	errorMessage?: string;
	estimatedCostCents?: number;
	estimatedLatencyMs?: number;
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
