// ─── Approval Gate Types ───────────────────────────────────────────
// Snapshots from @drenyra/agent-swarm/src/erp/types/approval-level.ts
// and @drenyra/agent-swarm/src/erp/approval-gate/approval-gate.types.ts

import type { AgentContext } from './agent-context';

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

export interface ApprovalRequest {
	id: string;
	toolName: string;
	input: unknown;
	context: AgentContext;
	approvalLevel: ApprovalLevel;
	state: ApprovalState;
	proposedAt: Date;
	decidedAt?: Date;
	reviewerId?: string;
	reviewerRole?: string;
	governanceResult?: GovernanceBundleResult;
	rationale?: string;
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
