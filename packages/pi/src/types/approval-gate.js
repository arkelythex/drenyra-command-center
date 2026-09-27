export const APPROVAL_LEVEL_ORDER = {
    auto: 0,
    notify: 1,
    gate: 2,
    fiscal_gate: 3,
};
export function isFiscalAction(level) {
    return level === "fiscal_gate";
}
export function requiresHumanApproval(level) {
    return level === "gate" || level === "fiscal_gate";
}
export function requiresGovernanceBundle(level) {
    return level === "fiscal_gate";
}
//# sourceMappingURL=approval-gate.js.map