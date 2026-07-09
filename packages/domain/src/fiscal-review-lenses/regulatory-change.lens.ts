/**
 * RegulatoryChangeLens — Did the regulation change since this proposal/evidence was generated?
 *
 * Compares the regulation snapshot at evidence creation time with the current
 * snapshot. If they differ, the regulation may have changed and the evidence
 * validity could be affected.
 *
 * Uses `RegulationSnapshot` hashes for fast comparison:
 * - Same hash = no regulation changes
 * - Different hash = regulation may have changed, manual review recommended
 * - No snapshot = cannot verify
 */

import type {
	EvidenceInput,
	FiscalReviewLens,
	LensContext,
	LensFinding,
	LensResult,
} from "./lens.interface";

export class RegulatoryChangeLens implements FiscalReviewLens {
	name = "Regulatory Change";
	id = "regulatory-change";
	version = "1.0.0";

	async review(evidence: EvidenceInput, ctx: LensContext): Promise<LensResult> {
		const findings: LensFinding[] = [];
		const metadata = evidence.metadata ?? {};

		// Get the regulation snapshot at time of evidence creation
		const evidenceSnapshotHash = metadata.regulationSnapshotHash as
			| string
			| undefined;

		// Get current applicable regulations from context
		const currentRegulations = ctx.applicableRegulations ?? [];

		// 1. Check if evidence has a regulation snapshot reference
		if (!evidenceSnapshotHash) {
			findings.push({
				severity: "WARNING",
				code: "REG-001",
				message:
					"Evidence has no regulation snapshot reference — cannot verify regulatory currency",
				evidence: "metadata.regulationSnapshotHash is missing",
			});
		}

		// 2. Check if current regulations are available
		if (currentRegulations.length === 0) {
			findings.push({
				severity: "WARNING",
				code: "REG-002",
				message: "No current regulation snapshots available for comparison",
				evidence: "ctx.applicableRegulations is empty",
			});
		}

		// 3. Compare hashes if both are available
		if (evidenceSnapshotHash && currentRegulations.length > 0) {
			const currentHash = currentRegulations
				.map((r) => r.hash)
				.sort()
				.join(":");

			// Compute a combined hash of current regulations
			const combinedHash = simpleHash(currentHash);

			if (evidenceSnapshotHash !== combinedHash) {
				const changedRegulations = currentRegulations.filter(
					(r) => evidence.metadata[`reg:${r.snapshotId}`] !== r.hash,
				);

				findings.push({
					severity: "CRITICAL",
					code: "REG-003",
					message:
						"Regulations have changed since this evidence was generated — validity may be affected",
					evidence: `evidenceHash=${evidenceSnapshotHash}, currentHash=${combinedHash}, changedRegs=${changedRegulations.length}`,
				});
			}
		}

		// 4. Check fiscal calendar alignment
		if (ctx.fiscalCalendar) {
			const evidenceYear = metadata.fiscalYear as number | undefined;
			if (evidenceYear && evidenceYear !== ctx.fiscalCalendar.year) {
				findings.push({
					severity: "WARNING",
					code: "REG-004",
					message: `Evidence fiscal year (${evidenceYear}) differs from current year (${ctx.fiscalCalendar.year})`,
					evidence: `evidenceYear=${evidenceYear}, currentYear=${ctx.fiscalCalendar.year}`,
				});
			}
		}

		const criticalCount = findings.filter(
			(f) => f.severity === "CRITICAL",
		).length;
		const passed = criticalCount === 0;

		return {
			passed,
			score: passed ? Math.max(0.5, 1 - findings.length * 0.12) : 0.2,
			findings,
			confidence:
				evidenceSnapshotHash && currentRegulations.length > 0 ? 0.85 : 0.5,
		};
	}
}

/** Simple non-cryptographic hash for regulation comparison. */
function simpleHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0; // Convert to 32bit integer
	}
	return Math.abs(hash).toString(16).padStart(8, "0");
}
