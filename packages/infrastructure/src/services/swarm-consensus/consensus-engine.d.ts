import type { AgentConfidence, AlertSeverity } from "./types";
export declare const THRESHOLD_CONFIG: {
	readonly low: {
		readonly base: 0.77;
		readonly critical: 0.95;
	};
	readonly medium: {
		readonly base: 0.82;
		readonly critical: 0.95;
	};
	readonly high: {
		readonly base: 0.88;
		readonly critical: 0.95;
	};
	readonly critical: {
		readonly base: 0.95;
		readonly critical: 0.99;
	};
};
export declare function calculateWeightedConfidence(
	confidences: AgentConfidence[],
): AgentConfidence[];
export declare function computeConsensusScore(
	confidences: AgentConfidence[],
): number;
export declare function getThresholdForSeverity(
	severity: keyof typeof THRESHOLD_CONFIG,
): number;
export declare function computeDynamicThreshold(
	severity: AlertSeverity,
	falsePositiveRate: number,
): number;
export declare function generateReasoning(
	confidences: AgentConfidence[],
	consensusScore: number,
	threshold: number,
	dynamicAdjustment?: number,
): string;
//# sourceMappingURL=consensus-engine.d.ts.map
