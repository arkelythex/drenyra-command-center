import { RUC } from "../_domain-types/ruc";

export const SUPPORTED_COUNTRY_CODES = ["PE"] as const;
export type FiscalCountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];

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
} as const;

export type FiscalObjectKind =
	(typeof FISCAL_OBJECT_KIND)[keyof typeof FISCAL_OBJECT_KIND];

export const FISCAL_RELATION_KIND = {
	BELONGS_TO_SCOPE: "belongs_to_scope",
	DERIVED_FROM: "derived_from",
	SUPPORTED_BY: "supported_by",
	VALIDATED_BY: "validated_by",
	APPROVED_BY: "approved_by",
	RECONCILES_WITH: "reconciles_with",
	POSTS_TO: "posts_to",
	SUPERSEDES: "supersedes",
} as const;

export type FiscalRelationKind =
	(typeof FISCAL_RELATION_KIND)[keyof typeof FISCAL_RELATION_KIND];

export const LEGAL_RULE_SOURCE = {
	SUNAT: "SUNAT",
	COUNTRY_PACK: "COUNTRY_PACK",
	INTERNAL_POLICY: "INTERNAL_POLICY",
} as const;

export type LegalRuleSource =
	(typeof LEGAL_RULE_SOURCE)[keyof typeof LEGAL_RULE_SOURCE];

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

export function createFiscalPeriod(value: string): FiscalPeriod {
	if (!isFiscalPeriodValue(value)) {
		throw new Error(`Invalid fiscal period: ${value}`);
	}

	return { value };
}

export function isFiscalPeriodValue(value: string): boolean {
	if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
		return false;
	}

	const year = Number.parseInt(value.slice(0, 4), 10);
	return year >= 2000 && year <= 2100;
}

export function createFiscalOntologyScope(input: {
	organizationId: string;
	companyId: string;
	companyRuc: string | RUC;
	period: string | FiscalPeriod;
	countryCode: FiscalCountryCode;
}): FiscalOntologyScope {
	const scope: FiscalOntologyScope = {
		organizationId: input.organizationId.trim(),
		companyId: input.companyId.trim(),
		companyRuc:
			input.companyRuc instanceof RUC
				? input.companyRuc
				: RUC.create(input.companyRuc),
		period:
			typeof input.period === "string"
				? createFiscalPeriod(input.period)
				: input.period,
		countryCode: input.countryCode,
	};

	if (!isFiscalOntologyScope(scope)) {
		throw new Error("Invalid fiscal ontology scope");
	}

	return scope;
}

export function isFiscalOntologyScope(
	value: FiscalOntologyScope,
): value is FiscalOntologyScope {
	return (
		value.organizationId.trim().length > 0 &&
		value.companyId.trim().length > 0 &&
		value.companyRuc instanceof RUC &&
		RUC.isValid(value.companyRuc.toString()) &&
		isFiscalPeriodValue(value.period.value) &&
		SUPPORTED_COUNTRY_CODES.includes(value.countryCode)
	);
}

export function isSameFiscalOntologyScope(
	left: FiscalOntologyScope,
	right: FiscalOntologyScope,
): boolean {
	return (
		left.organizationId === right.organizationId &&
		left.companyId === right.companyId &&
		left.companyRuc.equals(right.companyRuc) &&
		left.period.value === right.period.value &&
		left.countryCode === right.countryCode
	);
}

export function canRelateFiscalObjects(
	from: FiscalObjectIdentity,
	to: FiscalObjectIdentity,
): boolean {
	return isSameFiscalOntologyScope(from.scope, to.scope);
}

export function createFiscalObjectRelation(
	input: FiscalObjectRelationInput,
): FiscalObjectRelation {
	if (!canRelateFiscalObjects(input.from, input.to)) {
		throw new Error("Fiscal object relation crosses fiscal scope");
	}

	return input;
}
