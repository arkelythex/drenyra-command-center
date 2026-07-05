/**
 * Model Router Types — Domain Contract
 *
 * Minimal type definitions for model routing repository contracts.
 * These are the domain-level interfaces that persistence implements.
 * The canonical type definitions live in @drenyra/ai.
 */
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

export interface ModelRegistration {
	provider: string;
	model: string;
	capabilities: ModelCapability[];
	status: "ACTIVE" | "DEGRADED" | "OFFLINE" | "DEPRECATED";
	priority: number;
	config?: Record<string, unknown>;
}

export interface CapabilityRoutingRule {
	capability: ModelCapability;
	provider: string;
	model: string;
	weight: number;
	fallbackProvider?: string;
	fallbackModel?: string;
}

export interface RoutingResult {
	provider: string;
	model: string;
	capability: ModelCapability;
	confidence: number;
	latencyMs?: number;
}
