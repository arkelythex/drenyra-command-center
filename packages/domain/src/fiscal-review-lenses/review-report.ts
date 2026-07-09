/**
 * ReviewReport — aggregated result from multiple fiscal review lenses.
 *
 * Orchestrates running multiple lenses on the same evidence and
 * produces a unified report with overall score and recommendation.
 */

import type {
	EvidenceInput,
	FiscalReviewLens,
	LensContext,
	LensFinding,
	LensResult,
} from "./lens.interface";

/** Aggregated review report from multiple lenses. */
export interface ReviewReport {
	/** When the report was generated. */
	generatedAt: string;
	/** Individual lens results. */
	lenses: LensResultWithMeta[];
	/** Weighted average score across all lenses. */
	overallScore: number;
	/** All critical findings across all lenses. */
	criticalFindings: LensFinding[];
	/** Recommended action based on overall score. */
	recommendation: "APPROVE" | "REVIEW" | "REJECT";
}

/** Lens result with metadata. */
export interface LensResultWithMeta extends LensResult {
	lensId: string;
	lensName: string;
	lensVersion: string;
}

/**
 * Aggregate multiple lens results into a single ReviewReport.
 */
export function aggregateLensResults(
	results: LensResultWithMeta[],
): ReviewReport {
	if (results.length === 0) {
		return {
			generatedAt: new Date().toISOString(),
			lenses: [],
			overallScore: 1,
			criticalFindings: [],
			recommendation: "APPROVE",
		};
	}

	const criticalFindings = results.flatMap((r) =>
		r.findings.filter((f) => f.severity === "CRITICAL"),
	);

	const overallScore =
		results.reduce((sum, r) => sum + r.score, 0) / results.length;

	const recommendation =
		criticalFindings.length > 0
			? "REJECT"
			: overallScore >= 0.7
				? "APPROVE"
				: overallScore >= 0.4
					? "REVIEW"
					: "REJECT";

	return {
		generatedAt: new Date().toISOString(),
		lenses: results,
		overallScore,
		criticalFindings,
		recommendation,
	};
}

/**
 * Run multiple lenses on the same evidence and produce an aggregated report.
 */
export async function runLenses(
	lenses: FiscalReviewLens[],
	evidence: EvidenceInput,
	ctx: LensContext,
): Promise<ReviewReport> {
	const results = await Promise.all(
		lenses.map(async (lens) => {
			const result = await lens.review(evidence, ctx);
			return {
				...result,
				lensId: lens.id,
				lensName: lens.name,
				lensVersion: lens.version,
			};
		}),
	);

	return aggregateLensResults(results);
}
