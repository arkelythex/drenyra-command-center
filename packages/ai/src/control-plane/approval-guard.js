export const evaluateApprovalApplyGuard = ({ approvalState, decisionAllowed, }) => {
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
export const buildDeterministicHandoff = (approvalId) => ({
    approvalId,
    deterministicCommandReady: true,
    handoffMode: "deterministic-command",
    executeModelOutputAsTruth: false,
    authoritativeMutationAllowed: false,
});
//# sourceMappingURL=approval-guard.js.map