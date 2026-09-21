// ─── Approval Gate Types ───────────────────────────────────────────
// Snapshots from @drenyra/agent-swarm/src/erp/types/approval-level.ts
// and @drenyra/agent-swarm/src/erp/approval-gate/approval-gate.types.ts

import type { AgentContext } from "./agent-context";

// ─── ApprovalLevel ─────────────────────────────────────────────────

export type ApprovalLevel = "auto" | "notify" | "gate" | "fiscal_gate";

export const APPROVAL_LEVEL_ORDER: Record<ApprovalLevel, number> = {
	auto: 0,
	notify: 1,
	gate: 2,
	fiscal_gate: 3,
};

export function isFiscalAction(level: ApprovalLevel): boolean {
	return level === "fiscal_gate";
}

export function requiresHumanApproval(level: ApprovalLevel): boolean {
	return level === "gate" || level === "fiscal_gate";
}

export function requiresGovernanceBundle(level: ApprovalLevel): boolean {
	return level === "fiscal_gate";
}

// ─── Approval Types ────────────────────────────────────────────────

export type ApprovalState = "proposed" | "validated" | "approved" | "rejected";

/** A single recorded human approval, accumulated toward a fiscal_gate's dual-approval requirement. */
export interface ApprovalRecord {
	approverId: string;
	reviewerRole: string;
	at: string;
	reason?: string | undefined;
}

export interface ApprovalRequest {
	id: string;
	toolName: string;
	input: unknown;
	context: AgentContext;
	approvalLevel: ApprovalLevel;
	state: ApprovalState;
	proposedAt: Date;
	decidedAt?: Date | undefined;
	reviewerId?: string | undefined;
	reviewerRole?: string | undefined;
	governanceResult?: GovernanceBundleResult | undefined;
	rationale?: string | undefined;
	/**
	 * Distinct human approvals accumulated so far for a fiscal_gate request.
	 * Re-checked against the governance validator on every `approve()` call;
	 * the request only reaches `"approved"` once the gate's verdict is valid
	 * (e.g. two distinct approvers at R3) — see ApprovalGateEngine.approve().
	 */
	approvals?: ApprovalRecord[] | undefined;
}

export interface GovernanceBundleResult {
	valid: boolean;
	reasons: string[];
	evidenceRefs: string[];
}

export interface ApprovalDecision {
	approvalId: string;
	state: ApprovalState;
	reviewerId?: string;
	reviewerRole?: string;
}
