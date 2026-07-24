/**
 * SDD-009C — Risk, Gate, and Authority types.
 */

import type { AuthorityLevel } from "./budget";

// ============================================================================
// Diff Input — raw material for the classifier
// ============================================================================

export interface DiffInput {
	addedLines: string[];
	modifiedFiles: string[];
	renamedFiles: string[];
	deletedFiles: string[];
}

export interface DiffStats {
	addedLines: number;
	modifiedFiles: number;
	renamedFiles: string[];
	deletedFiles: string[];
}

// ============================================================================
// Classifier
// ============================================================================

export interface ClassifierConfig {
	version: string;
	paths: string[];
	contentPatterns: RegExp[];
	fallbackLevel: AuthorityLevel;
	excludedPaths: string[];
}

export interface ClassifierResult {
	level: AuthorityLevel;
	matchedPaths: string[];
	matchedContentPatterns: string[];
	blocked: boolean;
	ambiguous: boolean;
	failClosed: boolean;
	evaluatedAt: string;
	diffStats: DiffStats;
}

// ============================================================================
// Risk Decision — SDD-009C §2.1
// ============================================================================

export interface RiskDecision {
	level: AuthorityLevel;
	classifierVersion: string;
	matchedPaths: string[];
	matchedContentPatterns: string[];
	blocked: boolean;
	evaluatedAt: string;
	diffStats: DiffStats;
	requiresHumanAuth: boolean;
	humanAuthPresent: boolean;
	humanAuthExpired: boolean;
	humanAuthValidFor: string | null;
	classificationAmbiguous: boolean;
	failClosed: boolean;
	reason: string;
	configSource: string;
}

// ============================================================================
// Fiscal Gate Result — SDD-009C §2.2
// ============================================================================

export interface HumanAuth {
	required: boolean;
	present: boolean;
	authorizedBy: string | null;
	authorizedAt: string | null;
	candidateId: string | null;
}

export interface FiscalGateResult {
	gate: "pre-commit" | "pre-delegation" | "staged-review";
	decision: RiskDecision;
	receiptPresent: boolean;
	receiptHash: string | null;
	receiptValidForCandidate: boolean;
	humanAuth: HumanAuth;
	action: "allow" | "block" | "escalate";
	outputMessage: string;
}
