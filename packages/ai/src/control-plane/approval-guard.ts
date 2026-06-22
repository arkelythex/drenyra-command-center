import type { ApprovalState } from "./contracts";

export type ApprovalApplyGuardCode =
	| "OK"
	| "POLICY_BLOCKED"
	| "APPROVAL_PENDING"
	| "APPROVAL_REJECTED";

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

export const evaluateApprovalApplyGuard = ({
	approvalState,
	decisionAllowed,
}: EvaluateApprovalApplyGuardInput): ApprovalApplyGuardResult => {
	if (!decisionAllowed) {
		return { allowed: false, code: "POLICY_BLOCKED" };
	}

	if (approvalState === "rejected") {
		return { allowed: false, code: "APPROVAL_REJECTED" };
	}

	if (approvalState !== "approved") {
		return { allowed: false, code: "APPROVAL_PENDING" };
	}

	return { allowed: true, code: "OK" };
};

export const buildDeterministicHandoff = (
	approvalId: string,
): DeterministicHandoffEnvelope => ({
	approvalId,
	deterministicCommandReady: true,
	handoffMode: "deterministic-command",
	executeModelOutputAsTruth: false,
	authoritativeMutationAllowed: false,
});
