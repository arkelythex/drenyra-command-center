import { WorkspaceValidationError } from "./errors";

// ─── Branded Types ──────────────────────────────────────────────────────────

export type WorkspaceViewId = string & { readonly __brand: "WorkspaceViewId" };

// ─── View Kind ──────────────────────────────────────────────────────────────

export const VIEW_KIND = {
	LEDGER: "ledger",
	EVIDENCE: "evidence",
	SIRE_COMPARISON: "sire-comparison",
	AGENT_ACTIVITY: "agent-activity",
	FINANCIAL_DIFF: "financial-diff",
	APPROVAL: "approval",
	DOCUMENT_VIEWER: "document-viewer",
	CLOSE_READINESS: "close-readiness",
} as const;

export type ViewKind = (typeof VIEW_KIND)[keyof typeof VIEW_KIND];

// ─── LayoutPlacement ────────────────────────────────────────────────────────

export interface LayoutPlacement {
	readonly row: number;
	readonly column: number;
	readonly width: number;
	readonly height: number;
}

// ─── WorkspaceView ──────────────────────────────────────────────────────────

export interface WorkspaceView {
	readonly viewId: WorkspaceViewId;
	readonly workspaceId: string;
	readonly kind: ViewKind;
	readonly label: string;
	readonly placement: LayoutPlacement;
	readonly query: Record<string, unknown>;
	readonly createdAt: Date;
}

// ─── CreateViewInput ────────────────────────────────────────────────────────

export interface CreateViewInput {
	readonly workspaceId: string;
	readonly kind: ViewKind;
	readonly label: string;
	readonly placement: LayoutPlacement;
	readonly query: Record<string, unknown>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateViewId(): WorkspaceViewId {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID() as WorkspaceViewId;
	}
	return `view-${Date.now()}-${Math.random().toString(36).slice(2, 11)}` as WorkspaceViewId;
}

function validateViewInput(input: CreateViewInput): void {
	if (!input.workspaceId || input.workspaceId.trim().length === 0) {
		throw new WorkspaceValidationError("workspaceId must not be empty");
	}
	if (!input.label || input.label.trim().length === 0) {
		throw new WorkspaceValidationError("label must not be empty");
	}
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createView(input: CreateViewInput): WorkspaceView {
	validateViewInput(input);

	return {
		viewId: generateViewId(),
		workspaceId: input.workspaceId,
		kind: input.kind,
		label: input.label,
		placement: { ...input.placement },
		query: { ...input.query },
		createdAt: new Date(),
	};
}

// ─── Immutable Updates ──────────────────────────────────────────────────────

export function moveView(
	view: WorkspaceView,
	newPlacement: LayoutPlacement,
): WorkspaceView {
	return {
		...view,
		placement: { ...newPlacement },
	};
}
