export interface DelegationRule {
    parentId: string;
    childId: string;
    maxDepth: number;
    requiresApproval: boolean;
    inheritedContext: readonly string[];
    budgetLimit?: number;
}
export interface DelegationPolicy {
    rules: DelegationRule[];
    canDelegate(parentId: string, childId: string, depth: number): boolean;
    getRule(parentId: string, childId: string): DelegationRule | undefined;
    getLeaves(): DelegationRule[];
    getRoots(): DelegationRule[];
}
//# sourceMappingURL=delegation-policy.d.ts.map