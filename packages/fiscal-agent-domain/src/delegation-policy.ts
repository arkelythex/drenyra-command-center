/**
 * Delegation policy — rules for agent delegation.
 *
 * Unlike the current DelegationGraph which is a generic graph,
 * this adds fiscal-specific constraints: jurisdiction, risk, budget.
 */

/**
 * A rule defining when a parent agent may delegate to a child agent.
 */
export interface DelegationRule {
	/** Parent agent ID */
	parentId: string;
	/** Child agent ID */
	childId: string;
	/** Maximum delegation depth for this rule */
	maxDepth: number;
	/** Whether the child requires approval to execute */
	requiresApproval: boolean;
	/** Context items inherited from parent (e.g. "ruc", "periodo") */
	inheritedContext: readonly string[];
	/** Optional budget limit for child execution */
	budgetLimit?: number;
}

/**
 * Policy that governs delegation in the fiscal agent hierarchy.
 *
 * This is a **compiler** of delegation rules, not a runtime executor.
 * It validates that a delegation is allowed; actual execution is
 * delegated to the runtime (Pi SDK).
 */
export interface DelegationPolicy {
	/** All registered delegation rules */
	rules: DelegationRule[];

	/**
	 * Check if a parent agent may delegate to a child agent.
	 */
	canDelegate(parentId: string, childId: string, depth: number): boolean;

	/**
	 * Get the delegation rule for a specific parent-child pair.
	 */
	getRule(parentId: string, childId: string): DelegationRule | undefined;

	/**
	 * Get all leaf agents (agents that cannot delegate further).
	 */
	getLeaves(): DelegationRule[];

	/**
	 * Get all root agents (agents with no parent).
	 */
	getRoots(): DelegationRule[];
}
