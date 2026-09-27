import { RUC } from "../value-objects/RUC";
export declare const SUPPORTED_COUNTRY_CODES: readonly ["PE"];
export type FiscalCountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];
export declare const FISCAL_OBJECT_KIND: {
    readonly CPE: "cpe";
    readonly CDR: "cdr";
    readonly SIRE_RECORD: "sire_record";
    readonly BANK_TRANSACTION: "bank_transaction";
    readonly PAYMENT_EVIDENCE: "payment_evidence";
    readonly OBLIGATION: "obligation";
    readonly LEDGER_ENTRY: "ledger_entry";
    readonly APPROVAL: "approval";
    readonly EVIDENCE_NODE: "evidence_node";
    readonly FISCAL_TRUTH_EVENT: "fiscal_truth_event";
};
export type FiscalObjectKind = (typeof FISCAL_OBJECT_KIND)[keyof typeof FISCAL_OBJECT_KIND];
export declare const FISCAL_RELATION_KIND: {
    readonly BELONGS_TO_SCOPE: "belongs_to_scope";
    readonly DERIVED_FROM: "derived_from";
    readonly SUPPORTED_BY: "supported_by";
    readonly VALIDATED_BY: "validated_by";
    readonly APPROVED_BY: "approved_by";
    readonly RECONCILES_WITH: "reconciles_with";
    readonly POSTS_TO: "posts_to";
    readonly SUPERSEDES: "supersedes";
};
export type FiscalRelationKind = (typeof FISCAL_RELATION_KIND)[keyof typeof FISCAL_RELATION_KIND];
export declare const LEGAL_RULE_SOURCE: {
    readonly SUNAT: "SUNAT";
    readonly COUNTRY_PACK: "COUNTRY_PACK";
    readonly INTERNAL_POLICY: "INTERNAL_POLICY";
};
export type LegalRuleSource = (typeof LEGAL_RULE_SOURCE)[keyof typeof LEGAL_RULE_SOURCE];
export interface FiscalPeriod {
    value: string;
}
export interface FiscalOntologyScope {
    organizationId: string;
    companyId: string;
    companyRuc: RUC;
    period: FiscalPeriod;
    countryCode: FiscalCountryCode;
}
export interface FiscalObjectIdentity {
    id: string;
    kind: FiscalObjectKind;
    scope: FiscalOntologyScope;
}
export interface LegalRuleReference {
    ruleSetId: string;
    source: LegalRuleSource;
    effectiveFrom: string;
    effectiveTo: string | null;
    version: string;
}
export interface CountryPackBoundary {
    countryCode: FiscalCountryCode;
    taxAuthority: "SUNAT";
    electronicDocumentName: "CPE";
    registryFeedName: "SIRE";
    defaultCurrency: "PEN";
    ruleReferences: LegalRuleReference[];
}
export interface FiscalObjectRelation {
    id: string;
    kind: FiscalRelationKind;
    from: FiscalObjectIdentity;
    to: FiscalObjectIdentity;
    ruleReference: LegalRuleReference | null;
    createdAt: string;
}
export type FiscalObjectRelationInput = FiscalObjectRelation;
export declare function createFiscalPeriod(value: string): FiscalPeriod;
export declare function isFiscalPeriodValue(value: string): boolean;
export declare function createFiscalOntologyScope(input: {
    organizationId: string;
    companyId: string;
    companyRuc: string | RUC;
    period: string | FiscalPeriod;
    countryCode: FiscalCountryCode;
}): FiscalOntologyScope;
export declare function isFiscalOntologyScope(value: FiscalOntologyScope): value is FiscalOntologyScope;
export declare function isSameFiscalOntologyScope(left: FiscalOntologyScope, right: FiscalOntologyScope): boolean;
export declare function canRelateFiscalObjects(from: FiscalObjectIdentity, to: FiscalObjectIdentity): boolean;
export declare function createFiscalObjectRelation(input: FiscalObjectRelationInput): FiscalObjectRelation;
//# sourceMappingURL=types.d.ts.map