/**
 * Financial Change Set — isolated candidate for accounting changes.
 *
 * A Change Set groups multiple changes (diffs, classifications, reconciliations)
 * into one reviewable unit. It is isolated from the production ledger until
 * approved and posted.
 *
 * Inspired by: Git branches, Codex PRs, Code Review packages.
 * NOT called "branch" or "worktree" in the UI — this is accounting, not code.
 */

export type ChangeSetStatus =
	| "draft" // Being prepared, not ready for review
	| "proposed" // Ready for review
	| "in_review" // Under professional review
	| "changes_requested" // Reviewer requested changes
	| "approved" // Approved for posting
	| "posted" // Posted to production ledger
	| "rejected" // Rejected by reviewer
	| "cancelled"; // Cancelled before posting

export type ChangeSetRisk = "low" | "medium" | "high" | "critical";

export interface ChangeSetSummary {
	id: string;
	label: string;
	description: string;
	status: ChangeSetStatus;
	risk: ChangeSetRisk;
	companyName: string;
	period: string;
	intent: string;

	/** Counts */
	totalChanges: number;
	approvedChanges: number;
	rejectedChanges: number;
	pendingChanges: number;

	/** Financial impact */
	estimatedImpact: number;
	impactCurrency: string;

	/** Materiality */
	materiality: "immaterial" | "material" | "very_material";

	/** Evidence */
	evidenceCount: number;

	/** Timeline */
	createdAt: string;
	updatedAt: string;
	reviewDeadline?: string;

	/** Review status */
	reviewerId?: string;
	reviewerName?: string;
	requiresSeniorReview: boolean;
	approvalCount: number;
	requiredApprovals: number;

	/** Agent info */
	preparedByAgent: string;
	agentConfidence: number;
}

export interface ChangeSetDetail extends ChangeSetSummary {
	productionLedgerState: "clean" | "diverged" | "unknown";
	hasConflicts: boolean;
	conflictCount: number;
	linkedDocuments: number;
}

export const CHANGE_SET_STATUS_MAP: Record<
	ChangeSetStatus,
	{ label: string; color: string; icon: string }
> = {
	draft: { label: "Borrador", color: "gray", icon: "FileEdit" },
	proposed: { label: "Propuesto", color: "blue", icon: "FilePlus" },
	in_review: { label: "En revisión", color: "purple", icon: "Search" },
	changes_requested: {
		label: "Cambios solicitados",
		color: "amber",
		icon: "RefreshCw",
	},
	approved: { label: "Aprobado", color: "green", icon: "CheckCircle" },
	posted: { label: "Contabilizado", color: "emerald", icon: "CheckSquare" },
	rejected: { label: "Rechazado", color: "red", icon: "XCircle" },
	cancelled: { label: "Cancelado", color: "gray", icon: "XSquare" },
};

/**
 * Change Set lifecycle state machine.
 */
export const CHANGE_SET_TRANSITIONS: Record<
	ChangeSetStatus,
	ChangeSetStatus[]
> = {
	draft: ["proposed", "cancelled"],
	proposed: ["in_review", "cancelled"],
	in_review: ["approved", "changes_requested", "rejected"],
	changes_requested: ["draft", "cancelled"], // Goes back to draft for edits
	approved: ["posted", "cancelled"],
	posted: [],
	rejected: [],
	cancelled: [],
};
