import type { DelegationContext, GeavonMatchResult, GeavonRule } from "./types";

const RULES: readonly GeavonRule[] = [
	{
		id: "direct-info",
		name: "Informational query — direct response",
		description:
			"Simple informational queries without tool use are answered directly",
		match: (ctx) =>
			ctx.queryType === "informational" &&
			!ctx.requiresToolUse &&
			ctx.estimatedComplexity !== "high",
		action: "direct",
	},
	{
		id: "banking-reconciliation",
		name: "Banking reconciliation — delegate to Eviden",
		description:
			"Banking reconciliation queries → available as inline skill artifact",
		match: (ctx) =>
			ctx.fiscalDomain === "banking" &&
			(ctx.queryType === "document-processing" ||
				ctx.queryType === "data-retrieval"),
		action: "delegate",
		suggestedAgent: "eviden",
	},
	{
		id: "delegate-document",
		name: "Document processing — delegate to Eviden",
		description: "Document/evidence processing requires the evidence sub-agent",
		match: (ctx) =>
			ctx.queryType === "document-processing" ||
			ctx.fiscalDomain === "evidence",
		action: "delegate",
		suggestedAgent: "eviden",
	},
	{
		id: "delegate-compliance",
		name: "Compliance audit — delegate to Vigila",
		description:
			"Compliance and tax risk assessment delegates to the risk sub-agent",
		match: (ctx) =>
			ctx.queryType === "compliance-audit" && ctx.fiscalDomain === "tax",
		action: "delegate",
		suggestedAgent: "vigila",
	},
	{
		id: "delegate-multistep",
		name: "Multi-step orchestration — delegate to orchestrator",
		description: "Multi-step processes require an orchestrator sub-agent",
		match: (ctx) => ctx.queryType === "multi-step",
		action: "delegate",
		suggestedAgent: "traza",
	},
	{
		id: "delegate-tool",
		name: "Tool-backed query on fiscal domain — delegate",
		description: "Any fiscal-domain query requiring tool use is delegated",
		match: (ctx) =>
			ctx.requiresToolUse &&
			ctx.fiscalDomain !== null &&
			ctx.queryType !== "informational",
		action: "delegate",
		suggestedAgent: "eviden",
	},
	{
		id: "escalate-ambiguous",
		name: "Ambiguous or high-complexity — escalate",
		description:
			"High-complexity queries with no clear match escalate to human",
		match: (ctx) =>
			ctx.estimatedComplexity === "high" && ctx.fiscalDomain === null,
		action: "escalate",
	},
];

/**
 * Evaluate delegation context against all Geavon rules.
 * Returns the **first** matching rule's action, or defaults to DIRECT.
 */
export function evaluateDelegationRules(
	ctx: DelegationContext,
): GeavonMatchResult {
	// If user explicitly requested a sub-agent, delegate immediately
	if (ctx.explicitAgentRequest) {
		return {
			action: "delegate",
			reason: `User explicitly requested agent "${ctx.explicitAgentRequest}"`,
			matchedRuleId: null,
			suggestedAgent: ctx.explicitAgentRequest,
		};
	}

	for (const rule of RULES) {
		if (rule.match(ctx)) {
			return {
				action: rule.action,
				reason: rule.description,
				matchedRuleId: rule.id,
				suggestedAgent: rule.suggestedAgent ?? null,
			};
		}
	}

	// Default: handle directly
	return {
		action: "direct",
		reason: "No matching delegation rule — handling directly",
		matchedRuleId: null,
		suggestedAgent: null,
	};
}
