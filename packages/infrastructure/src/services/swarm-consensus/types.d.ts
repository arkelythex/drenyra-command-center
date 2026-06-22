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
export interface FalsePositiveStats {
    total: number;
    falsePositives: number;
    rate: number;
    lookbackDays: number;
}
export interface DynamicConsensusOptions {
    enableDynamicThreshold?: boolean;
    fpLookbackDays?: number;
}
//# sourceMappingURL=types.d.ts.map