/**
 * Swarm Consensus Types - ARKELYTHEX 2026
 *
 * Types for multi-agent consensus system (lector/validador/detector)
 * @since 2026.1.0
 */

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AgentRole = "lector" | "validador" | "detector";

export interface AgentConfidence {
	agentId: string;
	agentRole: AgentRole;
	confidence: number;
	reasoning?: string;
	timestamp: Date;
}

export interface ConsensusResult {
	threshold: number;
	/** FP-driven upward shift from base threshold (0 when no adjustment) */
	dynamicAdjustment: number;
	consensusScore: number;
	shouldTriggerAlert: boolean;
	confidenceBreakdown: AgentConfidence[];
	reasoning: string;
	thresholdReason: string;
}

export interface AlertTraceability {
	id: string;
	entityType: string;
	entityId: string;
	alertType: string;
	severity: AlertSeverity;
	status: string;
	detectorConfidence: string | null;
	lectorConfidence: string | null;
	lectorReasoning: string | null;
	validadorConfidence: string | null;
	validadorReasoning: string | null;
	swarmConsensusThreshold: string | null;
	swarmConsensusScore: string | null;
	alertReasoning: string;
	alertContext: Record<string, unknown> | null;
	isFalsePositive: boolean;
	falsePositiveReason: string | null;
	resolvedAt: Date | null;
	createdAt: Date;
}

/**
 * Historical false positive statistics for a given org + severity window
 */
export interface FalsePositiveStats {
	total: number;
	falsePositives: number;
	/** Ratio 0–1; 0 when total === 0 (no history → conservative, no adjustment) */
	rate: number;
	lookbackDays: number;
}

export interface DynamicConsensusOptions {
	/**
	 * Adjust threshold based on historical FP rate for the org.
	 * @default true
	 */
	enableDynamicThreshold?: boolean;
	/**
	 * Lookback window for FP rate calculation.
	 * @default 30
	 */
	fpLookbackDays?: number;
}
