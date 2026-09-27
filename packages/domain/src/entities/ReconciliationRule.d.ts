export type ReconciliationRuleType = "MATCH" | "EXCLUSION";
export type ReconciliationRuleConditions = Record<string, unknown>;
export interface ReconciliationRuleProps {
    id: string;
    companyId: string;
    name: string;
    ruleType: ReconciliationRuleType;
    conditions: ReconciliationRuleConditions;
    priority: number;
    isActive: boolean;
    createdAt: Date;
}
export declare class ReconciliationRule {
    private readonly props;
    private constructor();
    static createNew(params: {
        companyId: string;
        name: string;
        ruleType: ReconciliationRuleType;
        conditions: ReconciliationRuleConditions;
        priority: number;
        isActive?: boolean;
    }): ReconciliationRule;
    static create(props: ReconciliationRuleProps): ReconciliationRule;
    private validateInvariants;
    private isValidConditions;
    deactivate(): ReconciliationRule;
    activate(): ReconciliationRule;
    updatePriority(newPriority: number): ReconciliationRule;
    updateConditions(newConditions: ReconciliationRuleConditions): ReconciliationRule;
    get id(): string;
    get companyId(): string;
    get name(): string;
    get ruleType(): ReconciliationRuleType;
    get conditions(): ReconciliationRuleConditions;
    get priority(): number;
    get isActive(): boolean;
    get createdAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=ReconciliationRule.d.ts.map