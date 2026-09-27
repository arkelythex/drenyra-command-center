import { Money } from "../value-objects/Money";
export interface FiscalRuleLegalBasis {
    code: string;
    source: "SUNAT" | "EL_PERUANO" | "MEF";
    description: string;
}
export interface BancarizationRuleVersion {
    ruleId: "peru.bancarization.means-of-payment";
    version: "DL-1529-2022-v1";
    countryCode: "PE";
    effectiveFrom: "2022-04-01";
    thresholds: {
        PEN: Money;
        USD: Money;
    };
    legalBasis: readonly FiscalRuleLegalBasis[];
}
export interface BancarizationEvaluation {
    requiresAuditablePaymentMethod: boolean;
    ruleVersion: BancarizationRuleVersion["version"];
    legalBasis: readonly FiscalRuleLegalBasis[];
}
export declare const PERU_BANCARIZATION_RULE_2026: BancarizationRuleVersion;
export declare function evaluateBancarizationRule(amount: Money, rule?: BancarizationRuleVersion): BancarizationEvaluation;
//# sourceMappingURL=rule-set.d.ts.map