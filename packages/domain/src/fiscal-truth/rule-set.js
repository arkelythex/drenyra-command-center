import { Money } from "../value-objects/Money";
export const PERU_BANCARIZATION_RULE_2026 = {
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
            description: "Monto mínimo para utilizar Medios de Pago en operaciones pactadas en moneda nacional o dólares.",
        },
        {
            code: "DL-1529-2022",
            source: "EL_PERUANO",
            description: "Modifica la Ley 28194 y reduce los umbrales de bancarización a S/ 2,000 y US$ 500 desde 2022-04-01.",
        },
    ],
};
export function evaluateBancarizationRule(amount, rule = PERU_BANCARIZATION_RULE_2026) {
    const currency = amount.getCurrency();
    const threshold = currency === "PEN"
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
//# sourceMappingURL=rule-set.js.map