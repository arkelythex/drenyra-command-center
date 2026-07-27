/**
 * Financial Diff — extends AccountingDiff with financial impact,
 * policy evidence, materiality, and professional review status.
 *
 * A financial diff is not just "before/after values."
 * It adds: EBITDA impact, asset impact, deferred tax,
 * policy reference, classifier confidence, evidence links,
 * and review chain.
 */

export interface FinancialImpact {
	ebitda?: number;
	assets?: number;
	liabilities?: number;
	equity?: number;
	deferredTax?: "none" | "review_required" | "calculated";
	deferredTaxAmount?: number;
	currency: string;
}

export type Materiality = "immaterial" | "material" | "very_material";

export interface PolicyReference {
	id: string;
	code: string; // e.g. "POL-INTANGIBLES-03"
	name: string;
	version: string;
	appliedAt: string;
}

export interface ReviewStatus {
	preparedBy: string;
	preparedAt: string;
	reviewedBy?: string;
	reviewedAt?: string;
	status: "pending" | "approved" | "rejected" | "changes_requested";
	approvalLevel: "R0" | "R1" | "R2" | "R3";
}

export interface EvidenceLink {
	id: string;
	label: string;
	type: "document" | "receipt" | "calculation" | "source";
	verified: boolean;
}

/**
 * FinancialDiffDetail — the full financial diff view.
 *
 * Shown in the diff pane of the Workbench.
 * Extends the existing DiffDTO with financial-specific fields.
 */
export interface FinancialDiffDetail {
	id: string;
	changeSetId: string;

	// Core diff
	title: string;
	description: string;
	beforeAmount: number;
	afterAmount: number;
	delta: number;
	accountCode: string;
	accountName: string;

	// Financial impact
	impact: FinancialImpact;
	materiality: Materiality;

	// Policy
	policy: PolicyReference;

	// Confidence
	classifierConfidence: number; // 0-1
	validated: boolean;

	// Evidence
	evidence: EvidenceLink[];

	// Review
	review: ReviewStatus;

	// Source
	source: string;
	sourceTimestamp: string;
}

/**
 * FinancialDiffSummary — condensed view for lists.
 */
export interface FinancialDiffSummary {
	id: string;
	title: string;
	accountCode: string;
	accountName: string;
	delta: number;
	materiality: Materiality;
	status: ReviewStatus["status"];
	policy: string;
	preparedBy: string;
}

/**
 * Format delta for display.
 */
export function formatDelta(delta: number, _currency = "PEN"): string {
	const sign = delta >= 0 ? "+" : "";
	return `${sign}S/ ${Math.abs(delta).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

/**
 * Materiality color mapping.
 */
export function materialityColor(m: Materiality): string {
	switch (m) {
		case "immaterial":
			return "text-green-600 bg-green-500/10";
		case "material":
			return "text-amber-600 bg-amber-500/10";
		case "very_material":
			return "text-red-600 bg-red-500/10";
	}
}
