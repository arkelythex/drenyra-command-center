const APPROVAL_ACTIONS = [
    "sunat",
    "submit",
    "enviar",
    "filing",
    "posting",
    "ledger post",
    "ple",
    "export signed",
];
export function taskRequiresApproval(task, agentRequiresApproval) {
    if (agentRequiresApproval)
        return true;
    const lower = task.toLowerCase();
    return APPROVAL_ACTIONS.some((a) => lower.includes(a));
}
//# sourceMappingURL=approval.js.map