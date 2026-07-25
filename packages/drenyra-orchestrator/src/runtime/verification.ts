/**
 * SDD-009D — Verification and Agent Run Evidence types.
 */

import type { CacheCostBreakdown, TokenObservation } from "./budget";
import type { RiskDecision } from "./risk";

// ============================================================================
// Receipt — Gentle AI staged projection
// ============================================================================

export interface Receipt {
	hash: string;
	validForCandidateId: string;
	generatedAt: string;
	historical: boolean;
	validForGitIndex: boolean;
}

// ============================================================================
// Verification Envelope — SDD-009D §2.1
// ============================================================================

export interface VerificationResult {
	unitTestsPassed: boolean;
	lintPassed: boolean;
	typecheckPassed: boolean;
	fiscalLintPassed: boolean | null;
	iterationCount: number;
	finalStatus: "passed" | "escalated" | "blocked";
}

export interface HumanAuthRecord {
	required: boolean;
	present: boolean;
	authorizedAt: string | null;
	candidateId: string | null;
}

export interface VerificationEnvelope {
	phaseId: string;
	candidateId: string;
	receipt: Receipt;
	verificationResults: VerificationResult;
	tokens: TokenObservation;
	cost: CacheCostBreakdown;
	classifierCheck: RiskDecision | null;
	humanAuth: HumanAuthRecord | null;
	checksum: string;
}

// ============================================================================
// Agent Run Evidence — SDD-009D §2.2
// ============================================================================

export interface PhaseEvidence {
	phase: string;
	handoff: string; // HandoffEnvelope checksum reference
	verification: VerificationEnvelope;
	startTime: string;
	endTime: string;
	durationMs: number;
	error: string | null;
}

export interface RunEval {
	passed: boolean;
	failedCriteria: string[];
	risks: string[];
	recommendedActions: string[];
}

export interface PrivacyCheck {
	secretsDetected: boolean;
	fiscalDataDetected: boolean;
	piiDetected: boolean;
	blocked: boolean;
}

export interface AgentRunEvidence {
	sddChangeId: string;
	sddPhaseSequence: string[];
	phases: PhaseEvidence[];
	totalCostUsd: number | "UNOBSERVABLE";
	totalTokenSummary: TokenObservation;
	totalDurationMs: number;
	totalIterations: number;
	escalationCount: number;
	humanAuthCount: number;
	eval: RunEval;
	privacyCheck: PrivacyCheck;
	runNumber: number;
	isBaselineRun: boolean;
}
