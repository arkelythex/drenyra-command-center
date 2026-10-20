export interface ReconciliationCandidate {
	id: string;
	/** Sales invoice (money in) or purchase bill (money out). */
	documentKind: "INVOICE" | "BILL";
	ledgerEntryId: string;
	vendor: string;
	/** Soles, for display only; compare with `amountCents`. */
	amount: number;
	amountCents: number;
	score: number;
	rationale: string;
	sourceRecords: readonly string[];
	impact: string;
	proposedDiff: readonly string[];
}

export interface ReconciliationTransaction {
	id: string;
	date: string;
	description: string;
	/** Soles, for display only; compare with `amountCents`. */
	amount: number;
	/** Signed integer cents: positive = money in. */
	amountCents: number;
	status: "matched" | "suggested" | "needs_review" | "unmatched";
	confidence: number;
	matchedLedgerId?: string;
	notes: string;
	candidates: readonly ReconciliationCandidate[];
}

export interface ReconciliationLedgerEntry {
	id: string;
	date: string;
	vendor: string;
	amount: number;
	reference: string;
}
