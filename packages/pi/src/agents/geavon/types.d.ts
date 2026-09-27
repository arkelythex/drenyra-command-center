export type QueryType = "informational" | "document-processing" | "compliance-audit" | "multi-step" | "data-retrieval";
export type FiscalDomain = "invoice" | "tax" | "ledger" | "banking" | "payroll" | "compliance" | "evidence" | null;
export type Complexity = "low" | "medium" | "high";
export interface DelegationContext {
    queryType: QueryType;
    fiscalDomain: FiscalDomain;
    requiresToolUse: boolean;
    estimatedComplexity: Complexity;
    explicitAgentRequest?: string | null;
}
export type DelegationAction = "direct" | "delegate" | "escalate";
export interface GeavonRule {
    id: string;
    name: string;
    description: string;
    match: (ctx: DelegationContext) => boolean;
    action: DelegationAction;
    suggestedAgent?: string;
}
export interface GeavonMatchResult {
    action: DelegationAction;
    reason: string;
    matchedRuleId: string | null;
    suggestedAgent: string | null;
}
//# sourceMappingURL=types.d.ts.map