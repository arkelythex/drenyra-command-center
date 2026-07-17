export type OSApprovalLevel = "auto" | "notify" | "gate" | "policy_gate";

export const OS_APPROVAL_LEVEL_ORDER: Record<OSApprovalLevel, number> = {
	auto: 0,
	notify: 1,
	gate: 2,
	policy_gate: 3,
};

export function osRequiresHumanApproval(level: OSApprovalLevel): boolean {
	return level === "gate" || level === "policy_gate";
}
