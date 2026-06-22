export interface ReconciliationCandidate {
  id: string;
  ledgerEntryId: string;
  vendor: string;
  amount: number;
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
  amount: number;
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
