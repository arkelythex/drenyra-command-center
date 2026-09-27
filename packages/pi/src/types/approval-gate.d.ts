import type { AgentContext } from "./agent-context";
export type ApprovalLevel = "auto" | "notify" | "gate" | "fiscal_gate";
export declare const APPROVAL_LEVEL_ORDER: Record<ApprovalLevel, number>;
export declare function isFiscalAction(level: ApprovalLevel): boolean;
export declare function requiresHumanApproval(level: ApprovalLevel): boolean;
export declare function requiresGovernanceBundle(level: ApprovalLevel): boolean;
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
//# sourceMappingURL=approval-gate.d.ts.map