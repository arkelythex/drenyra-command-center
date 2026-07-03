export type DiffType =
	| "journalEntry"
	| "journalModify"
	| "taxImpact"
	| "reconciliation"
	| "compliance"
	| "risk";

export const DIFF_TYPES: readonly DiffType[] = [
	"journalEntry",
	"journalModify",
	"taxImpact",
	"reconciliation",
	"compliance",
	"risk",
] as const;
