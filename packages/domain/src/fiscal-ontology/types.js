import { RUC } from "../value-objects/RUC";
export const SUPPORTED_COUNTRY_CODES = ["PE"];
export const FISCAL_OBJECT_KIND = {
    CPE: "cpe",
    CDR: "cdr",
    SIRE_RECORD: "sire_record",
    BANK_TRANSACTION: "bank_transaction",
    PAYMENT_EVIDENCE: "payment_evidence",
    OBLIGATION: "obligation",
    LEDGER_ENTRY: "ledger_entry",
    APPROVAL: "approval",
    EVIDENCE_NODE: "evidence_node",
    FISCAL_TRUTH_EVENT: "fiscal_truth_event",
};
export const FISCAL_RELATION_KIND = {
    BELONGS_TO_SCOPE: "belongs_to_scope",
    DERIVED_FROM: "derived_from",
    SUPPORTED_BY: "supported_by",
    VALIDATED_BY: "validated_by",
    APPROVED_BY: "approved_by",
    RECONCILES_WITH: "reconciles_with",
    POSTS_TO: "posts_to",
    SUPERSEDES: "supersedes",
};
export const LEGAL_RULE_SOURCE = {
    SUNAT: "SUNAT",
    COUNTRY_PACK: "COUNTRY_PACK",
    INTERNAL_POLICY: "INTERNAL_POLICY",
};
export function createFiscalPeriod(value) {
    if (!isFiscalPeriodValue(value)) {
        throw new Error(`Invalid fiscal period: ${value}`);
    }
    return { value };
}
export function isFiscalPeriodValue(value) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
        return false;
    }
    const year = Number.parseInt(value.slice(0, 4), 10);
    return year >= 2000 && year <= 2100;
}
export function createFiscalOntologyScope(input) {
    const scope = {
        organizationId: input.organizationId.trim(),
        companyId: input.companyId.trim(),
        companyRuc: input.companyRuc instanceof RUC
            ? input.companyRuc
            : RUC.create(input.companyRuc),
        period: typeof input.period === "string"
            ? createFiscalPeriod(input.period)
            : input.period,
        countryCode: input.countryCode,
    };
    if (!isFiscalOntologyScope(scope)) {
        throw new Error("Invalid fiscal ontology scope");
    }
    return scope;
}
export function isFiscalOntologyScope(value) {
    return (value.organizationId.trim().length > 0 &&
        value.companyId.trim().length > 0 &&
        value.companyRuc instanceof RUC &&
        RUC.isValid(value.companyRuc.toString()) &&
        isFiscalPeriodValue(value.period.value) &&
        SUPPORTED_COUNTRY_CODES.includes(value.countryCode));
}
export function isSameFiscalOntologyScope(left, right) {
    return (left.organizationId === right.organizationId &&
        left.companyId === right.companyId &&
        left.companyRuc.equals(right.companyRuc) &&
        left.period.value === right.period.value &&
        left.countryCode === right.countryCode);
}
export function canRelateFiscalObjects(from, to) {
    return isSameFiscalOntologyScope(from.scope, to.scope);
}
export function createFiscalObjectRelation(input) {
    if (!canRelateFiscalObjects(input.from, input.to)) {
        throw new Error("Fiscal object relation crosses fiscal scope");
    }
    return input;
}
//# sourceMappingURL=types.js.map