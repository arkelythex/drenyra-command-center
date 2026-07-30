/**
 * Geavon — Delegation Rule Engine
 *
 * Determines whether the orchestrator should handle a query directly
 * or delegate to a specialized sub-agent.
 */

export type QueryType =
	| "informational"
	| "document-processing"
	| "compliance-audit"
	| "multi-step"
	| "data-retrieval";

export type FiscalDomain =
	| "invoice"
	| "tax"
	| "ledger"
	| "banking"
	| "payroll"
	| "compliance"
	| "evidence"
	| null;

export type Complexity = "low" | "medium" | "high";

export interface DelegationContext {
	queryType: QueryType;
	fiscalDomain: FiscalDomain;
	requiresToolUse: boolean;
	estimatedComplexity: Complexity;
	/** Optional hint: specific sub-agent the user mentioned */
	explicitAgentRequest?: string | null;
}

export type DelegationAction = "direct" | "delegate" | "escalate";

export interface GeavonRule {
	id: string;
	name: string;
	description: string;
	/** Predicate that returns true when this rule matches */
	match: (ctx: DelegationContext) => boolean;
	action: DelegationAction;
	/** Suggested sub-agent name (only for delegate actions) */
	suggestedAgent?: string;
}

export interface GeavonMatchResult {
	action: DelegationAction;
	reason: string;
	matchedRuleId: string | null;
	suggestedAgent: string | null;
}
