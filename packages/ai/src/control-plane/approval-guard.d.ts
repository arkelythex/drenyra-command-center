import type { ApprovalState } from "./contracts";
export type ApprovalApplyGuardCode = "OK" | "POLICY_BLOCKED" | "APPROVAL_PENDING" | "APPROVAL_REJECTED";
export interface EvaluateApprovalApplyGuardInput {
    approvalState: ApprovalState;
    decisionAllowed: boolean;
}
export interface ApprovalApplyGuardResult {
    allowed: boolean;
    code: ApprovalApplyGuardCode;
}
export interface DeterministicHandoffEnvelope {
    approvalId: string;
    deterministicCommandReady: true;
    handoffMode: "deterministic-command";
    executeModelOutputAsTruth: false;
    authoritativeMutationAllowed: false;
}
export declare const evaluateApprovalApplyGuard: ({ approvalState, decisionAllowed, }: EvaluateApprovalApplyGuardInput) => ApprovalApplyGuardResult;
export declare const buildDeterministicHandoff: (approvalId: string) => DeterministicHandoffEnvelope;
//# sourceMappingURL=approval-guard.d.ts.map