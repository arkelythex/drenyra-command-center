import {
	calculateWeightedConfidence,
	computeConsensusScore,
	computeDynamicThreshold,
	generateReasoning,
	getThresholdForSeverity,
} from "@drenyra/ai/services/swarm-consensus/consensus-engine";
import type {
	AgentConfidence,
	AlertSeverity,
} from "@drenyra/ai/services/swarm-consensus/types";
import type {
	SireArbiterDecision,
	SireCreatorProposal,
	SireDestructorChallenge,
} from "./sire-adversarial-audit.types";
import type { SubagentResult } from "./sire-readiness-subagents.service";

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function averageValidationConfidence(checks: SubagentResult[]): number {
	if (checks.length === 0) return 0.5;
	const total = checks.reduce((acc, check) => acc + check.confidence, 0);
	return clamp(Number((total / checks.length).toFixed(3)), 0, 1);
}

function buildConfidences(
	creator: SireCreatorProposal,
	destructor: SireDestructorChallenge,
	checks: SubagentResult[],
): AgentConfidence[] {
	return [
		{
			agentId: "creator-subagent",
			agentRole: "lector",
			confidence: creator.confidence,
			reasoning: creator.reasons.join(" "),
			timestamp: new Date(),
		},
		{
			agentId: "validation-subagent",
			agentRole: "validador",
			confidence: averageValidationConfidence(checks),
			reasoning: checks.map((check) => check.message).join(" | "),
			timestamp: new Date(),
		},
		{
			agentId: "destructor-subagent",
			agentRole: "detector",
			confidence: destructor.confidence,
			reasoning:
				destructor.blockers[0] ?? destructor.warnings[0] ?? "Sin observaciones",
			timestamp: new Date(),
		},
	];
}

function resolveDecision(
	consensusScore: number,
	threshold: number,
	destructor: SireDestructorChallenge,
): SireArbiterDecision["decision"] {
	if (destructor.severity === "critical") return "rejected";
	if (destructor.blockers.length > 0 && consensusScore < threshold)
		return "rejected";
	if (destructor.blockers.length === 0 && consensusScore >= threshold)
		return "approved";
	return "manual_review";
}

/**
 * runSireAdversarialArbiter operation.
 *
 * @param input - Input for input.
 * @returns Result of runSireAdversarialArbiter.
 * @example
 * ```ts
 * const result = runSireAdversarialArbiter({});
 * console.log(result);
 * ```
 */
export function runSireAdversarialArbiter(input: {
	creator: SireCreatorProposal;
	destructor: SireDestructorChallenge;
	checks: SubagentResult[];
	falsePositiveRate?: number;
}): SireArbiterDecision {
	const severity: AlertSeverity = input.destructor.severity;
	const confidences = buildConfidences(
		input.creator,
		input.destructor,
		input.checks,
	);
	const weighted = calculateWeightedConfidence(confidences);
	const consensusScore = computeConsensusScore(weighted);
	const fpRate = clamp(input.falsePositiveRate ?? 0, 0, 0.99);
	const threshold = computeDynamicThreshold(severity, fpRate);
	const baseThreshold = getThresholdForSeverity(severity);
	const dynamicAdjustment = Number((threshold - baseThreshold).toFixed(4));
	const decision = resolveDecision(consensusScore, threshold, input.destructor);

	return {
		decision,
		consensusScore: Number(consensusScore.toFixed(4)),
		threshold: Number(threshold.toFixed(4)),
		dynamicAdjustment,
		shouldTriggerAlert: decision !== "approved",
		reasoning: generateReasoning(
			weighted,
			consensusScore,
			threshold,
			dynamicAdjustment,
		),
		severity,
	};
}
