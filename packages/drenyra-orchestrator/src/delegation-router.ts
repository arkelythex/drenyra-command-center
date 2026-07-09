/**
 * Drenyra Orchestrator — Delegation Router
 *
 * Determines the appropriate work route (inline, delegate, or SDD)
 * based on task characteristics and mandatory delegation triggers.
 */

import type { DelegationTrigger, RouteDecision } from "./types";

// ============================================================================
// Trigger Evaluators
// ============================================================================

interface TaskProfile {
	/** Number of files that need to be read to understand the task. */
	filesToUnderstand: number;
	/** Number of non-trivial files that will be written/modified. */
	filesToWrite: number;
	/** Whether this is a commit/push/PR operation after code changes. */
	isGitWorkflowEvent: boolean;
	/** Whether this follows a tooling/worktree/git incident. */
	isIncidentRecovery: boolean;
	/** Tool calls already made this session. */
	sessionToolCalls: number;
	/** Exploratory file reads already made this session. */
	sessionExploratoryReads: number;
	/** Non-mechanical edits already made this session. */
	sessionNonMechanicalEdits: number;
	/** Whether this is a review/audit task needing fresh context. */
	isReviewTask: boolean;
}

const TRIGGER_THRESHOLDS = {
	FILES_TO_UNDERSTAND: 4,
	FILES_TO_WRITE: 2,
	SESSION_TOOL_CALLS: 20,
	SESSION_EXPLORATORY_READS: 5,
	SESSION_NON_MECHANICAL_EDITS: 2,
} as const;

function evaluateTriggers(profile: TaskProfile): DelegationTrigger[] {
	const triggered: DelegationTrigger[] = [];

	if (profile.filesToUnderstand >= TRIGGER_THRESHOLDS.FILES_TO_UNDERSTAND) {
		triggered.push({
			rule: "4-file-rule",
			description:
				"Understanding requires reading 4+ files — delegate a scout/mapping task",
			threshold: TRIGGER_THRESHOLDS.FILES_TO_UNDERSTAND,
		});
	}

	if (profile.filesToWrite >= TRIGGER_THRESHOLDS.FILES_TO_WRITE) {
		triggered.push({
			rule: "multi-file-write",
			description:
				"Implementation touches 2+ non-trivial files — delegate one writer",
			threshold: TRIGGER_THRESHOLDS.FILES_TO_WRITE,
		});
	}

	if (profile.isGitWorkflowEvent) {
		triggered.push({
			rule: "pr-rule",
			description:
				"Before commit/push/PR for code changes — run a fresh-context review lens",
			threshold: "git-workflow-event",
		});
	}

	if (profile.isIncidentRecovery) {
		triggered.push({
			rule: "incident-rule",
			description:
				"After a tooling/worktree/git incident — run a fresh audit first",
			threshold: "incident-recovery",
		});
	}

	if (
		profile.sessionToolCalls >= TRIGGER_THRESHOLDS.SESSION_TOOL_CALLS ||
		profile.sessionExploratoryReads >=
			TRIGGER_THRESHOLDS.SESSION_EXPLORATORY_READS ||
		profile.sessionNonMechanicalEdits >=
			TRIGGER_THRESHOLDS.SESSION_NON_MECHANICAL_EDITS
	) {
		triggered.push({
			rule: "long-session",
			description: `Long session (${profile.sessionToolCalls} calls, ${profile.sessionExploratoryReads} reads, ${profile.sessionNonMechanicalEdits} edits) — pause and delegate`,
			threshold: `${profile.sessionToolCalls}/${profile.sessionExploratoryReads}/${profile.sessionNonMechanicalEdits}`,
		});
	}

	if (profile.isReviewTask) {
		triggered.push({
			rule: "fresh-review",
			description:
				"Fresh-context review for diffs/conflicts/PR readiness/incidents",
			threshold: "review-task",
		});
	}

	return triggered;
}

// ============================================================================
// Route Evaluator
// ============================================================================

/**
 * Given a task profile, determine the appropriate work route.
 *
 * The ladder:
 * 1. Inline Direct — small, mechanical, known context
 * 2. Simple Delegation — requires focused exploration/validation/multi-file work
 * 3. SDD — large, ambiguous, architectural, product-facing, multi-area, high-risk
 */
export function determineRoute(profile: TaskProfile): RouteDecision {
	const triggers = evaluateTriggers(profile);
	const isSmall =
		profile.filesToUnderstand <= 1 &&
		profile.filesToWrite <= 1 &&
		!profile.isIncidentRecovery &&
		!profile.isReviewTask;

	// If ANY mandatory trigger fires, it's at minimum a delegation.
	if (triggers.length > 0) {
		// SDD for tasks that are large, ambiguous, cross-cutting, or high-risk
		const multiWrite = triggers.find((t) => t.rule === "multi-file-write");
		const fourFile = triggers.find((t) => t.rule === "4-file-rule");
		const longSession = triggers.find((t) => t.rule === "long-session");

		if (multiWrite && profile.filesToWrite >= 4) {
			return {
				route: "sdd",
				reason: "Large implementation (4+ files) requires full SDD lifecycle",
				triggeredBy: triggers,
				recommendedSubagent: "sdd-planner",
			};
		}

		if (fourFile && profile.filesToUnderstand >= 8) {
			return {
				route: "sdd",
				reason: "Extensive exploration (8+ files) warrants SDD structure",
				triggeredBy: triggers,
				recommendedSubagent: "sdd-explore",
			};
		}

		if (longSession) {
			return {
				route: "sdd",
				reason: "Session fatigue — compress and hand off with SDD structure",
				triggeredBy: triggers,
				recommendedSubagent: "sdd-planner",
			};
		}

		return {
			route: "simple-delegation",
			reason: `Triggered ${triggers.length} delegation rule(s)`,
			triggeredBy: triggers,
			recommendedSubagent: profile.isReviewTask ? "reviewer" : "worker",
		};
	}

	if (isSmall) {
		return {
			route: "inline-direct",
			reason: "Small, mechanical, known context — execute inline",
			triggeredBy: [],
		};
	}

	return {
		route: "simple-delegation",
		reason: "Not small enough for inline, not complex enough for SDD",
		triggeredBy: [],
		recommendedSubagent: "worker",
	};
}
