/**
 * AlertSeverity type.
 *
 * @example
 * ```ts
 * const value: AlertSeverity = {} as AlertSeverity;
 * console.log(value);
 * ```
 */
export type AlertSeverity = "low" | "medium" | "high" | "critical";

/**
 * AgentRole type.
 *
 * @example
 * ```ts
 * const value: AgentRole = {} as AgentRole;
 * console.log(value);
 * ```
 */
export type AgentRole = "lector" | "validador" | "detector";

/**
 * AgentConfidence interface.
 *
 * @example
 * ```ts
 * const value: AgentConfidence = {} as AgentConfidence;
 * console.log(value);
 * ```
 */
export interface AgentConfidence {
	agentId: string;
	agentRole: AgentRole;
	confidence: number;
	reasoning?: string;
	timestamp: Date;
}

/**
 * ConsensusResult interface.
 *
 * @example
 * ```ts
 * const value: ConsensusResult = {} as ConsensusResult;
 * console.log(value);
 * ```
 */
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

/**
 * AlertTraceability interface.
 *
 * @example
 * ```ts
 * const value: AlertTraceability = {} as AlertTraceability;
 * console.log(value);
 * ```
 */
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
 *  Historical false positive statistics for a given org + severity window
 * @example
 * ```ts
 * const value: FalsePositiveStats = {} as FalsePositiveStats;
 * console.log(value);
 * ```
 */

export interface FalsePositiveStats {
	total: number;
	falsePositives: number;
	/** Ratio 0–1; 0 when total === 0 (no history → conservative, no adjustment) */
	rate: number;
	lookbackDays: number;
}

/**
 * DynamicConsensusOptions interface.
 *
 * @example
 * ```ts
 * const value: DynamicConsensusOptions = {} as DynamicConsensusOptions;
 * console.log(value);
 * ```
 */
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
