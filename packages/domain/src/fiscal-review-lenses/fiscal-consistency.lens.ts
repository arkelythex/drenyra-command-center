/**
 * FiscalConsistencyLens — Do base amounts, IGV, total match?
 *
 * Checks that:
 * - subtotal + IGV ≈ total (within rounding tolerance)
 * - IGV rate is approximately 18% of subtotal (current Peruvian rate)
 * - Amounts are positive numbers
 * - No inverted sign errors (negative amounts where positive expected)
 */

import type {
	EvidenceInput,
	FiscalReviewLens,
	LensContext,
	LensFinding,
	LensResult,
} from "./lens.interface";

/** Current Peruvian IGV rate. */
const IGV_RATE = 0.18;

/** Rounding tolerance in currency units. */
const ROUNDING_TOLERANCE = 0.02;

/** Expected IGV rate tolerance (for rate changes). */
const IGV_RATE_TOLERANCE = 0.005;

export class FiscalConsistencyLens implements FiscalReviewLens {
	name = "Fiscal Consistency";
	id = "fiscal-consistency";
	version = "1.0.0";

	async review(
		evidence: EvidenceInput,
		_ctx: LensContext,
	): Promise<LensResult> {
		const findings: LensFinding[] = [];
		const output =
			(evidence.output as Record<string, unknown> | undefined) ?? {};

		const subtotal = Number(output.subtotal ?? 0);
		const igv = Number(output.igv ?? 0);
		const total = Number(output.total ?? 0);
		const detraccion = Number(output.detraccion ?? 0);

		// 1. Basic positivity checks
		if (subtotal < 0) {
			findings.push({
				severity: "CRITICAL",
				code: "FIS-001",
				message: `Subtotal is negative: ${subtotal}`,
				evidence: `subtotal=${subtotal}`,
			});
		}

		if (igv < 0) {
			findings.push({
				severity: "CRITICAL",
				code: "FIS-002",
				message: `IGV is negative: ${igv}`,
				evidence: `igv=${igv}`,
			});
		}

		if (total < 0) {
			findings.push({
				severity: "CRITICAL",
				code: "FIS-003",
				message: `Total is negative: ${total}`,
				evidence: `total=${total}`,
			});
		}

		// 2. Check subtotal + IGV ≈ total
		if (subtotal > 0 && igv >= 0 && total > 0) {
			const expectedTotal = subtotal + igv;
			const totalDiff = Math.abs(expectedTotal - total);
			if (totalDiff > ROUNDING_TOLERANCE) {
				findings.push({
					severity: "CRITICAL",
					code: "FIS-004",
					message: `Subtotal (${subtotal}) + IGV (${igv}) = ${expectedTotal} but total is ${total} (diff: ${totalDiff})`,
					evidence: `subtotal=${subtotal}, igv=${igv}, total=${total}, diff=${totalDiff}`,
				});
			}
		}

		// 3. Check IGV ≈ 18% of subtotal
		if (subtotal > 0 && igv > 0) {
			const expectedIgv = subtotal * IGV_RATE;
			const igvDiff = Math.abs(igv - expectedIgv);
			if (igvDiff > subtotal * IGV_RATE_TOLERANCE) {
				findings.push({
					severity: "WARNING",
					code: "FIS-005",
					message: `IGV (${igv}) deviates from ${IGV_RATE * 100}% of subtotal (${expectedIgv.toFixed(2)}). Diff: ${igvDiff.toFixed(2)}`,
					evidence: `subtotal=${subtotal}, igv=${igv}, expectedIgv=${expectedIgv.toFixed(2)}, rate=${IGV_RATE}`,
				});
			}
		}

		// 4. Check detracción consistency (if present)
		if (detraccion > 0) {
			if (detraccion >= total) {
				findings.push({
					severity: "CRITICAL",
					code: "FIS-006",
					message: `Detracción (${detraccion}) exceeds or equals total (${total})`,
					evidence: `detraccion=${detraccion}, total=${total}`,
				});
			}

			// Detracción is typically a percentage of total
			const detraccionPct = (detraccion / total) * 100;
			if (detraccionPct > 15) {
				findings.push({
					severity: "WARNING",
					code: "FIS-007",
					message: `Detracción percentage (${detraccionPct.toFixed(2)}%) is unusually high`,
					evidence: `detraccion=${detraccion}, total=${total}, pct=${detraccionPct.toFixed(2)}%`,
				});
			}
		}

		const criticalCount = findings.filter(
			(f) => f.severity === "CRITICAL",
		).length;
		const passed = criticalCount === 0;

		return {
			passed,
			score: passed
				? Math.max(0.5, 1 - findings.length * 0.15)
				: Math.max(0, 0.5 - criticalCount * 0.2),
			findings,
			confidence: subtotal > 0 && igv > 0 && total > 0 ? 0.9 : 0.6,
		};
	}
}
