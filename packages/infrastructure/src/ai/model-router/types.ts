import type { ModelCapability } from "@arkelythex/domain/ai";

export interface CapabilityScore {
	modelId: string;
	capability: ModelCapability;
	score: number;
	costCents: number;
	latencyMs: number;
	reliability: number;
}

export interface RoutingRequest {
	capability: ModelCapability;
	contextSize: number;
	maxCostCents?: number;
	maxLatencyMs?: number;
	preferredModelIds?: string[];
}

export interface RouterConfig {
	defaultStrategy: string;
	auditEnabled: boolean;
	probeCadenceMs: number;
}
