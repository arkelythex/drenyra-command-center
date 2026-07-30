// ─── Workspace Layout Template ──────────────────────────────────────────────

export const WORKSPACE_LAYOUT_TEMPLATE = {
	PORTFOLIO_OPERATIONS: "portfolio-operations",
	MONTHLY_CLOSE: "monthly-close",
	SIRE_REVIEW: "sire-review",
	BANK_RECONCILIATION: "bank-reconciliation",
	EVIDENCE_AUDIT: "evidence-audit",
} as const;

export type WorkspaceLayoutTemplate =
	(typeof WORKSPACE_LAYOUT_TEMPLATE)[keyof typeof WORKSPACE_LAYOUT_TEMPLATE];
