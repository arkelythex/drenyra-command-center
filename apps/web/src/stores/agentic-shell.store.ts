import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types matching backend DTOs ────────────────────────────────────────────

export interface InspectorPanel {
	type: "thread" | "diff" | "agent" | "evidence" | "fiscal";
	id: string;
	title: string;
}

/**
 * ReviewQueueItemDTO — contrato backend real.
 * @see apps/api/src/features/diffs/diffs.types.ts
 */
export interface ReviewQueueItem {
	id: string;
	diffId: string;
	title: string;
	type:
		| "MONTHLY_CLOSE"
		| "CPE_REVIEW"
		| "SIRE_REVIEW"
		| "LEDGER_REVIEW"
		| "CONCILIATION"
		| "EVIDENCE_REVIEW";
	priority: "critical" | "high" | "medium" | "low";
	status: "pending" | "reviewed" | "escalated";
	clientName: string;
	period: string;
	agentName: string;
	riskScore: number;
	/** Monto S/ afectado — visible en la cola, sin entrar al detalle */
	amount: number;
	/** Fecha límite normativa (SUNAT, SIRE) */
	deadline?: string;
	createdAt: string;
}

/**
 * DiffChange — contrato backend real.
 * @see packages/domain/src/entities/diff/diff-change.ts
 */
export interface DiffChange {
	field: string;
	before: unknown;
	after: unknown;
}

/**
 * DiffImpactDTO — contrato backend real.
 * @see apps/api/src/features/diffs/diffs.types.ts
 */
export interface DiffImpact {
	confidence: number;
	riskScore: number;
}

/**
 * DiffDetailDTO — contrato backend real.
 */
export interface DiffDetail {
	id: string;
	threadId: string;
	title: string;
	type: string;
	status: string;
	priority: string;
	riskScore: number;
	confidence: number;
	changesCount: number;
	createdAt: string;
	changes: DiffChange[];
	impact: DiffImpact;
	evidenceIds: string[];
}

/**
 * AgentRunOutput — contrato backend real.
 * @see packages/domain/src/drenyra/types.ts
 */
export interface VerificationAuditEvent {
	eventType: "VERIFICATION_BYPASSED" | "VERIFICATION_FAIL";
	finding: string;
	rule: string;
	reason: string;
	actorId: string;
	occurredAt: string;
	detail?: string;
}

export interface VerifiedFindingBase {
	finding: string;
	status: "pass" | "fail" | "inconclusive";
	rule: string;
	expected?: string;
	actual?: string;
	detail?: string;
}

export interface BypassedFinding {
	finding: string;
	status: "bypassed";
	rule: "NO_RULE_MATCHED";
	bypassReason: string;
	authorizedBy: { userId: string; role: string };
	detail: string;
}

export type VerifiedFinding = VerifiedFindingBase | BypassedFinding;

export interface VerificationMetrics {
	totalFindings: number;
	passed: number;
	failed: number;
	inconclusive: number;
	bypassed: number;
	integrityScore: number;
	perRuleMetrics: Record<
		string,
		{
			passed: number;
			failed: number;
			inconclusive: number;
			total: number;
		}
	>;
}

export interface VerificationReport {
	id: string;
	verifiedAt: string;
	adjustedConfidence: number;
	findings: VerifiedFinding[];
	auditEvents: VerificationAuditEvent[];
	integrityScore: number;
	summary: string;
	metrics: VerificationMetrics;
}

export interface AgentRunOutput {
	summary: string;
	findings: string[];
	riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	confidence: number;
	recommendedActions: string[];
	requiredEvidence: string[];
	approvalRequired: boolean;
	verificationReport?: VerificationReport;
}

/**
 * AgentRun — contrato backend real.
 * AgentRunStatus: STARTED | COMPLETED | FAILED
 */
export interface AgentRun {
	id: string;
	caseId: string;
	agentType: string;
	status: "STARTED" | "COMPLETED" | "FAILED";
	startedAt: string;
	completedAt?: string;
	output?: AgentRunOutput;
}

/** Vista activa del Panel 2 (Dynamic Canvas) */
export type WorkspaceView =
	| { kind: "empty" }
	| { kind: "review"; reviewItemId: string };

export interface AgenticShellState {
	// ── Sidebar ──
	isSidebarCollapsed: boolean;
	isSidebarMobileOpen: boolean;
	toggleSidebar: () => void;
	setSidebarCollapsed: (collapsed: boolean) => void;
	setSidebarMobileOpen: (open: boolean) => void;

	// ── Right Inspector ──
	activeInspector: InspectorPanel | null;
	openInspector: (panel: InspectorPanel) => void;
	closeInspector: () => void;

	// ── Command Palette ──
	isCommandPaletteOpen: boolean;
	openCommandPalette: () => void;
	closeCommandPalette: () => void;

	// ── Focus mode ──
	isFocusMode: boolean;
	setFocusMode: (focus: boolean) => void;

	// ── IDE Workspace state ──
	activeWorkspaceView: WorkspaceView;
	setActiveWorkspaceView: (view: WorkspaceView) => void;

	// ── Review Queue (backed by ReviewQueueItemDTO) ──
	reviewQueue: ReviewQueueItem[];
	setReviewQueue: (items: ReviewQueueItem[]) => void;
	updateReviewItem: (id: string, partial: Partial<ReviewQueueItem>) => void;
	activeReviewItem: ReviewQueueItem | null;
	setActiveReviewItem: (item: ReviewQueueItem | null) => void;

	// ── Diff detail (backed by DiffDetailDTO) ──
	activeDiffDetail: DiffDetail | null;
	setActiveDiffDetail: (detail: DiffDetail | null) => void;

	// ── Agent runs (backed by AgentRun) ──
	activeAgentRuns: AgentRun[];
	setActiveAgentRuns: (runs: AgentRun[]) => void;
}

// ── Default data (estructura correcta, valores representativos) ────────────

// ── Store ────────────────────────────────────────────────────────────────────

export const useAgenticShell = create<AgenticShellState>()(
	persist(
		(set) => ({
			isSidebarCollapsed: false,
			isSidebarMobileOpen: false,
			toggleSidebar: () =>
				set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
			setSidebarCollapsed: (collapsed) =>
				set({ isSidebarCollapsed: collapsed }),
			setSidebarMobileOpen: (open) => set({ isSidebarMobileOpen: open }),

			activeInspector: null,
			openInspector: (panel) => set({ activeInspector: panel }),
			closeInspector: () => set({ activeInspector: null }),

			isCommandPaletteOpen: false,
			openCommandPalette: () => set({ isCommandPaletteOpen: true }),
			closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

			isFocusMode: false,
			setFocusMode: (focus) => set({ isFocusMode: focus }),

			activeWorkspaceView: { kind: "empty" },
			setActiveWorkspaceView: (view) => set({ activeWorkspaceView: view }),

			reviewQueue: [],
			setReviewQueue: (items) => set({ reviewQueue: items }),
			updateReviewItem: (id, partial) =>
				set((s) => ({
					reviewQueue: s.reviewQueue.map((item) =>
						item.id === id ? { ...item, ...partial } : item,
					),
				})),
			activeReviewItem: null,
			setActiveReviewItem: (item) =>
				set({
					activeReviewItem: item,
					activeWorkspaceView: item
						? { kind: "review", reviewItemId: item.id }
						: { kind: "empty" },
				}),

			activeDiffDetail: null,
			setActiveDiffDetail: (detail) => set({ activeDiffDetail: detail }),

			activeAgentRuns: [],
			setActiveAgentRuns: (runs) => set({ activeAgentRuns: runs }),
		}),
		{
			name: "agentic-shell",
			partialize: (state) => ({
				isSidebarCollapsed: state.isSidebarCollapsed,
				isFocusMode: state.isFocusMode,
			}),
		},
	),
);
