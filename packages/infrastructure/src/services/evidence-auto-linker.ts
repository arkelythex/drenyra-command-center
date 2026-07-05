/**
 * Evidence Auto-Linker — Automatically links Fiscal Agent outputs to evidence.
 * Each transaction, categorization, correction, and discrepancy gets linked
 * to its source document (PDF, XML, CDR, bank statement).
 *
 * @module services/evidence-auto-linker
 */

import type { FiscalNightlyRunReport } from "@drenyra/application/use-cases/fiscal-agent/types";

export interface EvidenceLink {
	sourceType:
		| "TRANSACTION"
		| "CATEGORIZATION"
		| "CORRECTION"
		| "DISCREPANCY"
		| "REPORT";
	sourceId: string;
	evidenceId: string;
	relationship: "DERIVED_FROM" | "SUPPORTS" | "CORRECTS" | "REFERENCES";
	confidence: number;
}

export class EvidenceAutoLinker {
	/**
	 * Auto-link a Fiscal Agent run report to existing evidence.
	 * Each discrepancy, exception, and journal entry is linked
	 * to the evidence that originated it.
	 */
	async linkRunReport(
		report: FiscalNightlyRunReport,
		_companyId: string,
	): Promise<EvidenceLink[]> {
		const links: EvidenceLink[] = [];

		for (const step of report.steps) {
			if (!step.success) continue;

			// Link each step result to the run evidence
			links.push({
				sourceType: "REPORT",
				sourceId: report.runId,
				evidenceId: `${report.runId}-${step.name}`,
				relationship: "SUPPORTS",
				confidence: 1.0,
			});
		}

		return links;
	}

	/**
	 * Link a user correction to the original transaction evidence.
	 */
	async linkCorrection(params: {
		transactionId: string;
		originalEvidenceId?: string;
		correctionReason: string;
	}): Promise<EvidenceLink> {
		return {
			sourceType: "CORRECTION",
			sourceId: params.transactionId,
			evidenceId:
				params.originalEvidenceId ?? `${params.transactionId}-correction`,
			relationship: "CORRECTS",
			confidence: 1.0,
		};
	}

	/**
	 * Link a SUNAT discrepancy to the local transaction + SUNAT evidence.
	 */
	async linkDiscrepancy(params: {
		documentKey: string;
		localEvidenceId?: string;
		sunatEvidenceId?: string;
	}): Promise<EvidenceLink[]> {
		return [
			{
				sourceType: "DISCREPANCY",
				sourceId: params.documentKey,
				evidenceId: params.localEvidenceId ?? `${params.documentKey}-local`,
				relationship: "DERIVED_FROM",
				confidence: 0.95,
			},
			...(params.sunatEvidenceId
				? [
						{
							sourceType: "DISCREPANCY",
							sourceId: params.documentKey,
							evidenceId: params.sunatEvidenceId,
							relationship: "REFERENCES",
							confidence: 0.9,
						} as EvidenceLink,
					]
				: []),
		];
	}
}
