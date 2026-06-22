import type { AlertSeverity } from "@arkelythex/ai/services/swarm-consensus/types";
import type {
	SireAnomaly,
	SireReadinessInput,
	SubagentResult,
} from "./sire-readiness-subagents.service";

/**
 * SireAdversarialInput interface.
 *
 * @example
 * ```ts
 * const value: SireAdversarialInput = {} as SireAdversarialInput;
 * console.log(value);
 * ```
 */
export interface SireAdversarialInput extends SireReadinessInput {
	ruc: string;
	falsePositiveRate?: number;
}

/**
 * SireCreatorProposal interface.
 *
 * @example
 * ```ts
 * const value: SireCreatorProposal = {} as SireCreatorProposal;
 * console.log(value);
 * ```
 */
export interface SireCreatorProposal {
	intent: "submit_sire" | "reconcile_first";
	confidence: number;
	reasons: string[];
	recommendedAdjustments: Array<{
		field: "igv" | "rvie_rce" | "detraction";
		current: number;
		expected: number;
		gap: number;
	}>;
}

/**
 * SireDestructorChallenge interface.
 *
 * @example
 * ```ts
 * const value: SireDestructorChallenge = {} as SireDestructorChallenge;
 * console.log(value);
 * ```
 */
export interface SireDestructorChallenge {
	severity: AlertSeverity;
	confidence: number;
	blockers: string[];
	warnings: string[];
	parityAlerts: string[];
}

/**
 * SireArbiterDecision interface.
 *
 * @example
 * ```ts
 * const value: SireArbiterDecision = {} as SireArbiterDecision;
 * console.log(value);
 * ```
 */
export interface SireArbiterDecision {
	decision: "approved" | "manual_review" | "rejected";
	consensusScore: number;
	threshold: number;
	dynamicAdjustment: number;
	shouldTriggerAlert: boolean;
	reasoning: string;
	severity: AlertSeverity;
}

/**
 * SireAdversarialAuditResult interface.
 *
 * @example
 * ```ts
 * const value: SireAdversarialAuditResult = {} as SireAdversarialAuditResult;
 * console.log(value);
 * ```
 */
export interface SireAdversarialAuditResult {
	companyId: string;
	period: string;
	readinessStatus: "ready" | "manual_review" | "blocked";
	checks: SubagentResult[];
	anomalies: SireAnomaly[];
	creator: SireCreatorProposal;
	destructor: SireDestructorChallenge;
	arbiter: SireArbiterDecision;
	execution: {
		durationMs: number;
		mode: "adversarial-audit";
	};
}
