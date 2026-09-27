export const APPROVAL_LEVEL_ORDER = {
    R0: 0,
    R1: 1,
    R2: 2,
    R3: 3,
};
export function compareApprovalLevel(a, b) {
    return APPROVAL_LEVEL_ORDER[a] - APPROVAL_LEVEL_ORDER[b];
}
export function requiresHumanApproval(level) {
    return level === "R3";
}
export function requiresGovernanceBundle(level) {
    return level === "R2" || level === "R3";
}
//# sourceMappingURL=approval-policy.js.map