import type {
	CapabilityRoutingRule,
	ModelCapability,
	ModelRegistration,
	RoutingResult,
} from "@drenyra/ai/providers/model-router-types";

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
