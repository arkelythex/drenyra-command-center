/**
 * Approval policy — risk-based approval levels for fiscal actions.
 *
 * R0-R3 is the canonical Drenyra risk model. These types are pure domain.
 */

/**
 * Risk-based approval levels for fiscal actions.
 *
 * R0 — Read and explanation only. No state mutation.
 * R1 — Proposals and analysis. Reversible internal changes.
 * R2 — Controlled internal changes. Requires validation.
 * R3 — External fiscal/financial actions. Requires explicit human approval.
 */
export type ApprovalLevel = "R0" | "R1" | "R2" | "R3";

/**
 * Ordered list of approval levels for comparison.
 */
export const APPROVAL_LEVEL_ORDER: Record<ApprovalLevel, number> = {
	R0: 0,
	R1: 1,
	R2: 2,
	R3: 3,
};

/**
 * Compare two approval levels. Returns >0 if a is more restrictive.
 */
export function compareApprovalLevel(
	a: ApprovalLevel,
	b: ApprovalLevel,
): number {
	return APPROVAL_LEVEL_ORDER[a] - APPROVAL_LEVEL_ORDER[b];
}

/**
 * Check if an action at `level` requires explicit human approval.
 */
export function requiresHumanApproval(level: ApprovalLevel): boolean {
	return level === "R3";
}

/**
 * Check if an action at `level` requires governance bundle evidence.
 */
export function requiresGovernanceBundle(level: ApprovalLevel): boolean {
	return level === "R2" || level === "R3";
}

/**
 * An approval requirement for a specific action or agent.
 */
export interface ApprovalRequirement {
	/** The required approval level */
	level: ApprovalLevel;
	/** Agent IDs that may approve this action */
	allowedReviewers: readonly string[];
	/** Whether a governance bundle is required */
	requiresGovernanceBundle: boolean;
	/** Whether explicit human approval is required */
	requiresHumanApproval: boolean;
	/** Optional fiscal context that must accompany the request */
	requiredContext?: readonly string[];
}

/**
 * An approval policy maps agent capabilities to approval requirements.
 */
export interface ApprovalPolicy {
	/** Get the approval requirement for a specific capability */
	getRequirement(capabilityId: string): ApprovalRequirement;
	/** Register an approval requirement for a capability */
	setRequirement(capabilityId: string, requirement: ApprovalRequirement): void;
}
