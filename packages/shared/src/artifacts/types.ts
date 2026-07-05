/**
 * HubArtifact discriminated union and all payload types.
 *
 * Extracted from `cognitive-hub` feature for cross-package reuse.
 * Each artifact variant has a distinct typed payload — no `any`.
 *
 * @module artifacts/types
 */

// ─── Payload types ───────────────────────────────────────────────────────────

export interface AuditEvent {
	agent: string;
	time: string;
	description: string;
	type?: "decision" | "action" | "validation";
	impact?: string;
	rule?: string;
}

export interface LedgerEntry {
	account: string;
	debit: number;
	credit: number;
}

export interface ComparisonScenario {
	name: string;
	metrics: Array<{
		label: string;
		value: string;
		highlight?: boolean;
		delta?: number;
	}>;
	recommended?: boolean;
}

export interface SearchResult {
	source: string;
	relevance: number;
	snippet: string;
}

export interface GapItem {
	label: string;
	value: number;
}

export interface AccountingDiffItem {
	field: string;
	before: string;
	after: string;
	reason?: string;
}

export interface SheetDiffRow {
	id: string;
	record: string;
	original: string;
	corrected: string;
	status: "updated" | "unchanged" | "flagged";
	reason?: string;
}

// ─── Base artifact ───────────────────────────────────────────────────────────

export type BaseArtifact = { id: string; title: string };

// ─── Discriminated union ─────────────────────────────────────────────────────

export type HubArtifact =
	| (BaseArtifact & {
			type: "explanation";
			/** Main text — at top level to avoid nested payload access */
			content: string;
			metadata?: Record<string, string>;
	  })
	| (BaseArtifact & {
			type: "chart";
			payload: { data: number[]; labels?: string[] };
	  })
	| (BaseArtifact & {
			type: "table";
			payload: { events: AuditEvent[] };
	  })
	| (BaseArtifact & {
			type: "action_card";
			payload: { message?: string };
	  })
	| (BaseArtifact & {
			type: "simulation";
			payload: { entries: LedgerEntry[] };
	  })
	| (BaseArtifact & {
			type: "comparison";
			payload: { scenarios: ComparisonScenario[] };
	  })
	| (BaseArtifact & {
			type: "accounting_diff";
			payload: {
				command: string;
				scope: string;
				diffs: AccountingDiffItem[];
				summary?: string;
			};
	  })
	| (BaseArtifact & {
			type: "sheet_diff";
			payload: {
				command: string;
				sourceName: string;
				acceptShortcut: string;
				rows: SheetDiffRow[];
				summary: {
					total: number;
					updated: number;
					flagged: number;
				};
			};
	  })
	| (BaseArtifact & {
			type: "search_result";
			payload: { results: SearchResult[] };
	  })
	| (BaseArtifact & {
			type: "report";
			payload: { ruleSource?: string };
	  })
	| (BaseArtifact & {
			type: "knowledge_graph";
			payload: { linkCount?: number; confidence?: number };
	  })
	| (BaseArtifact & {
			type: "dashboard";
			payload: {
				primaryMetric: { value: string; trend: string };
				statusScore: number;
				gapAnalysis?: GapItem[];
				ruleSource?: string;
			};
	  });

/** Derived — always in sync with the union above */
export type ArtifactType = HubArtifact["type"];
