/**
 * Drenyra Orchestrator — Review Lenses
 *
 * Selects appropriate review lenses based on file paths and diff size.
 * Used by pre-commit/pre-push/pre-PR hooks and SDD phase gates.
 */

import type { ReviewLens } from "./types";
import { ALL_4R_LENSES } from "./types";

// ============================================================================
// Hot Path Detection
// ============================================================================

const DEFAULT_HOT_PATHS = [
	"auth",
	"security",
	"fiscal",
	"sunat",
	"compliance",
	"payments",
	"update",
];

/**
 * Check if a file path matches a hot/critical path.
 * Hot paths trigger full 4R review on PR.
 */
export function isHotPath(
	filePath: string,
	hotPaths: string[] = DEFAULT_HOT_PATHS,
): boolean {
	const normalized = filePath.replace(/\\/g, "/").toLowerCase();
	const segments = normalized.split("/");
	return hotPaths.some((hp) =>
		segments.some(
			(seg) =>
				seg === hp || seg.startsWith(`${hp}-`) || seg.startsWith(`${hp}_`),
		),
	);
}

// ============================================================================
// Lens Selection
// ============================================================================

export interface LensSelectionInput {
	/** Changed file paths. */
	filePaths: string[];
	/** Estimated changed lines (added + deleted). */
	changedLines: number;
	/** Whether this is a pre-commit hook. */
	isPreCommit: boolean;
	/** Whether this is a pre-PR hook. */
	isPrePR: boolean;
	/** Whether this follows an SDD design/apply phase. */
	isPostSDDPhase: boolean;
	/** Hot path patterns to check. */
	hotPaths?: string[];
	/** Line threshold for 4R recommendation. */
	lineThreshold?: number;
}

export interface LensSelectionResult {
	selectedLenses: ReviewLens[];
	reason: string;
	blocking: boolean;
}

/**
 * Select the appropriate review lenses for a given change.
 *
 * Rules:
 * - pre-commit: advisory readability only
 * - pre-push: advisory readability only
 * - pre-PR with hot paths or >400 lines: full 4R (blocking)
 * - post-SDD design/apply: judgment-day (blocking)
 * - default: readability (advisory)
 */
export function selectReviewLenses(
	input: LensSelectionInput,
): LensSelectionResult {
	const threshold = input.lineThreshold ?? 400;

	// Post-SDD phase: judgment-day
	if (input.isPostSDDPhase) {
		return {
			selectedLenses: ["judgment-day"],
			reason:
				"Post-SDD design/apply phase — run judgment-day adversarial review",
			blocking: true,
		};
	}

	// Pre-PR: check hot paths and size
	if (input.isPrePR) {
		const hasHotPath = input.filePaths.some((fp) =>
			isHotPath(fp, input.hotPaths),
		);
		const isLarge = input.changedLines > threshold;

		if (hasHotPath || isLarge) {
			return {
				selectedLenses: [
					"review-risk",
					"review-resilience",
					"review-readability",
					"review-reliability",
				],
				reason:
					hasHotPath && isLarge
						? `Hot path + ${input.changedLines} lines exceeds ${threshold} — full 4R required`
						: hasHotPath
							? "Hot path detected — full 4R required"
							: `${input.changedLines} lines exceeds ${threshold} — full 4R recommended`,
				blocking: true,
			};
		}

		// Default pre-PR: readability
		return {
			selectedLenses: ["review-readability"],
			reason: `Small change (${input.changedLines} lines) — readability check`,
			blocking: false,
		};
	}

	// Pre-commit or pre-push: advisory readability
	return {
		selectedLenses: ["review-readability"],
		reason: input.isPreCommit
			? "Pre-commit — advisory readability check"
			: "Pre-push — advisory readability check",
		blocking: false,
	};
}

/**
 * Get a human-readable description of what a review lens checks.
 */
export function getLensDescription(lens: ReviewLens): string {
	const config = ALL_4R_LENSES.find((l) => l.lens === lens);
	if (config) {
		return config.description;
	}
	if (lens === "judgment-day") {
		return "Adversarial dual review: blind review from two independent perspectives, fix confirmed issues, then re-judge";
	}
	return "Unknown review lens";
}
