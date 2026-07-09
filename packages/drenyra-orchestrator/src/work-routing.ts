/**
 * Drenyra Orchestrator — Work Routing Ladder
 *
 * Provides the canonical lightweight workflows and review workload
 * forecasting for Drenyra development.
 */

import type { ReviewWorkloadForecast, DeliveryStrategy } from "./types.ts";

// ============================================================================
// Workload Forecasting
// ============================================================================

export interface WorkloadInput {
	estimatedLines: number;
	estimatedFiles: number;
	affectedSubsystems: string[];
	isMechanicalRefactor: boolean;
	isFiscalChange: boolean;
	reviewerContext: "fresh" | "has-context";
}

const LINE_THRESHOLD = 400;
const CRITICAL_SUBSYSTEMS = [
	"fiscal",
	"sunat",
	"compliance",
	"auth",
	"security",
];

/**
 * Forecast review workload and recommend delivery strategy.
 */
export function forecastReviewWorkload(
	input: WorkloadInput,
): ReviewWorkloadForecast {
	const exceedsLineBudget = input.estimatedLines > LINE_THRESHOLD;
	const touchesCritical = input.affectedSubsystems.some((s) =>
		CRITICAL_SUBSYSTEMS.includes(s.toLowerCase()),
	);
	const isLargeRefactor =
		input.estimatedFiles > 2 && !input.isMechanicalRefactor;

	let deliveryStrategy: DeliveryStrategy;
	let chainedPRsRecommended: boolean;
	let decisionNeeded: boolean;
	let reason: string;

	if (input.isMechanicalRefactor && input.estimatedLines <= 600) {
		deliveryStrategy = "exception-ok";
		chainedPRsRecommended = false;
		decisionNeeded = false;
		reason =
			"Mechanical refactor — reviewable by diff, single PR OK up to 600 lines";
	} else if (exceedsLineBudget && touchesCritical) {
		deliveryStrategy = "ask-on-risk";
		chainedPRsRecommended = true;
		decisionNeeded = true;
		reason = `Exceeds ${LINE_THRESHOLD} lines AND touches critical subsystems — MUST chain PRs`;
	} else if (exceedsLineBudget) {
		deliveryStrategy = "ask-on-risk";
		chainedPRsRecommended = true;
		decisionNeeded = true;
		reason = `Exceeds ${LINE_THRESHOLD} lines — recommend chained PRs`;
	} else if (isLargeRefactor) {
		deliveryStrategy = "auto-chain";
		chainedPRsRecommended = true;
		decisionNeeded = false;
		reason = "Large refactor with clear phase boundaries — auto-chain";
	} else if (touchesCritical && input.reviewerContext === "fresh") {
		deliveryStrategy = "ask-on-risk";
		chainedPRsRecommended = false;
		decisionNeeded = false;
		reason =
			"Touches critical subsystems with fresh reviewer — single PR OK with 4R review";
	} else {
		deliveryStrategy = "single-pr";
		chainedPRsRecommended = false;
		decisionNeeded = false;
		reason = "Low risk, reviewer has context — single PR";
	}

	return {
		estimatedLines: input.estimatedLines,
		estimatedFiles: input.estimatedFiles,
		chainedPRsRecommended,
		deliveryStrategy,
		decisionNeeded,
		reason,
	};
}

// ============================================================================
// Canonical Workflow Descriptors
// ============================================================================

/**
 * Returns canonical workflow instructions for common Drenyra task types.
 */
export function getWorkflowInstructions(
	taskType: "bugfix" | "feature" | "fiscal-change" | "review" | "docs",
): string[] {
	const workflows: Record<string, string[]> = {
		bugfix: [
			"1. Parent: git status + clarify requirements",
			"2. Scout: fresh context to map the affected flow/files",
			"3. Parent: decide approach based on scout report",
			"4. Worker: implement fix + add/update tests",
			"5. Review lens: audit the diff",
			"6. Parent: validate and report",
		],
		feature: [
			"1. Parent: clarify scope, constraints, and acceptance criteria",
			"2. SDD: proposal → spec → design → tasks (if significant)",
			"3. Worker: implement in bounded batches",
			"4. Review lens: audit each batch",
			"5. Parent: validate against acceptance criteria",
		],
		"fiscal-change": [
			"1. Parent: identify fiscal scope (RUC, period, normativa)",
			"2. Compliance check: run compliance:sire-gate",
			"3. SDD: full fiscal SDD lifecycle (solicitud → análisis → diseño → plan → migración → auditoría)",
			"4. Worker: implement with fiscal evidence logging",
			"5. Review lens: review-reliability + review-risk",
			"6. Compliance-repro: run compliance:sire-repro",
			"7. Parent: verify fiscal correctness before merge",
		],
		review: [
			"1. Select review lens by risk profile",
			"2. Fresh-context subagent: exhaustive first pass",
			"3. Persist findings ledger",
			"4. Fix confirmed issues (if applicable)",
			"5. Scoped re-review on fix-touched lines only",
			"6. Report final ledger",
		],
		docs: [
			"1. Parent: identify doc gap or stale content",
			"2. Diátaxis quadrant: tutorial, how-to, reference, or explanation",
			"3. Cognitive load patterns: apply at least 3 of 6",
			"4. Writer: produce content in the same PR as code",
			"5. Verify: markdownlint + lychee link check",
		],
	};

	return (
		workflows[taskType] ?? [
			"1. Assess → 2. Route → 3. Execute → 4. Review → 5. Verify",
		]
	);
}
