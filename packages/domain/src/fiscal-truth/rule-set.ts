/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
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

export const PERU_BANCARIZATION_RULE_2026: BancarizationRuleVersion = {
	ruleId: "peru.bancarization.means-of-payment",
	version: "DL-1529-2022-v1",
	countryCode: "PE",
	effectiveFrom: "2022-04-01",
	thresholds: {
		PEN: Money.fromCents(200000, "PEN"),
		USD: Money.fromCents(50000, "USD"),
	},
	legalBasis: [
		{
			code: "Ley-28194-Art-4",
			source: "SUNAT",
			description:
				"Monto mínimo para utilizar Medios de Pago en operaciones pactadas en moneda nacional o dólares.",
		},
		{
			code: "DL-1529-2022",
			source: "EL_PERUANO",
			description:
				"Modifica la Ley 28194 y reduce los umbrales de bancarización a S/ 2,000 y US$ 500 desde 2022-04-01.",
		},
	],
} as const;

export function evaluateBancarizationRule(
	amount: Money,
	rule: BancarizationRuleVersion = PERU_BANCARIZATION_RULE_2026,
): BancarizationEvaluation {
	const currency = amount.getCurrency();
	const threshold =
		currency === "PEN"
			? rule.thresholds.PEN
			: currency === "USD"
				? rule.thresholds.USD
				: null;
	return {
		requiresAuditablePaymentMethod: threshold
			? amount.greaterThanOrEqual(threshold)
			: false,
		ruleVersion: rule.version,
		legalBasis: rule.legalBasis,
	};
}
