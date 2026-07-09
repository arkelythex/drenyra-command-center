/**
 * Core types for the Chained Compliance Pipeline.
 *
 * When a fiscal rule changes (e.g. IGV rate 18%→19%), the compliance pipeline
 * cascades the change through dependent subsystems with review gates between
 * each stage: Detracciones → PLE → SIRE.
 */

/** Types of fiscal rule changes. */
export type FiscalRuleChangeType =
	| "RATE"
	| "THRESHOLD"
	| "SCHEMA"
	| "REQUIREMENT";

/** A change in a fiscal rule. */
export interface FiscalRuleChange {
	/** Unique ID for this change. */
	changeId: string;
	/** What type of rule changed. */
	ruleType: FiscalRuleChangeType;
	/** Reference to the regulation (law/article). */
	affectedRegulation: string;
	/** The previous value. */
	oldValue: unknown;
	/** The new value. */
	newValue: unknown;
	/** When the change takes effect. */
	effectiveDate: string;
	/** Human-readable description. */
	description?: string;
}

/** A finding produced during a compliance stage. */
export interface ComplianceFinding {
	/** Stage that produced this finding. */
	stageId: string;
	/** Severity. */
	severity: "CRITICAL" | "WARNING" | "INFO";
	/** Short code. */
	code: string;
	/** Human-readable message. */
	message: string;
}

/** Context available to compliance stages. */
export interface ComplianceContext {
	/** Store for persisting evidence. */
	evidenceStore?: {
		store: (artifact: unknown) => Promise<unknown>;
	};
	/** Previous stage results, keyed by stageId. */
	previousStageResults: Map<string, ComplianceStageResult>;
	/** Available review lenses for optional validation. */
	lenses?: Array<{
		name: string;
		review: (
			evidence: unknown,
			ctx: unknown,
		) => Promise<{ passed: boolean; score: number }>;
	}>;
}

/** Result of executing a single compliance stage. */
export interface ComplianceStageResult {
	/** Execution status. */
	status: "PASSED" | "REVIEW_NEEDED" | "BLOCKED";
	/** Evidence ID for this stage's execution. */
	evidenceId: string;
	/** Findings from this stage. */
	findings: ComplianceFinding[];
	/** Confidence score 0-1. */
	confidence: number;
}

/** A single stage in a compliance chain. */
export interface ComplianceStage {
	/** Unique stage ID. */
	stageId: string;
	/** Human-readable name. */
	name: string;
	/** Description of what this stage does. */
	description: string;
	/** Which subsystem this stage affects. */
	affectedSubsystem: string;
	/** Whether this stage requires explicit human approval. */
	requiredApproval: boolean;
	/** Stage IDs that must complete before this one. */
	dependsOn: string[];
	/** Execute the stage with the given fiscal change. */
	execute: (
		change: FiscalRuleChange,
		ctx: ComplianceContext,
	) => Promise<ComplianceStageResult>;
}

/** A complete compliance chain definition. */
export interface ComplianceChain {
	/** Unique chain ID. */
	chainId: string;
	/** Human-readable name. */
	name: string;
	/** Description of the chain. */
	description: string;
	/** The stages in this chain. */
	stages: ComplianceStage[];
	/** What rule changes trigger this chain. */
	triggersOn: FiscalRuleChangeType[];
}

/** Complete result of running a compliance chain. */
export interface ComplianceChainResult {
	/** Chain ID. */
	chainId: string;
	/** Overall status. */
	status: "PASSED" | "REVIEW_NEEDED" | "BLOCKED";
	/** Results per stage. */
	stageResults: ComplianceStageResult[];
	/** All findings across all stages. */
	allFindings: ComplianceFinding[];
	/** The stage where execution stopped (if blocked). */
	blockedAtStage: string | null;
	/** Total duration in ms. */
	totalDurationMs: number;
	/** Whether human approval is pending. */
	approvalPending: boolean;
}

/** Compliance report — aggregate compliance status. */
export interface ComplianceReport {
	/** When the report was generated. */
	generatedAt: string;
	/** The fiscal rule change that triggered this. */
	change: FiscalRuleChange;
	/** Chains that were executed. */
	chainResults: ComplianceChainResult[];
	/** Overall compliance status. */
	overallStatus: "COMPLIANT" | "REVIEW_NEEDED" | "NON_COMPLIANT";
	/** Critical findings across all chains. */
	criticalFindings: ComplianceFinding[];
	/** Recommendations. */
	recommendations: string[];
}
