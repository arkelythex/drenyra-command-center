import { Money } from "../../value-objects/Money";
import { InvalidFinancialInputError } from "./types";
export function calculateNpv(input) {
    const { initialInvestment, cashFlows, discountRate } = input;
    if (cashFlows.length === 0) {
        throw new InvalidFinancialInputError("At least one cash flow is required");
    }
    if (discountRate < -100) {
        throw new InvalidFinancialInputError("Discount rate cannot be less than -100%");
    }
    const currency = initialInvestment.getCurrency();
    const rate = discountRate / 100;
    let presentValueCents = 0;
    for (let t = 0; t < cashFlows.length; t++) {
        const cf = cashFlows[t];
        const denominator = (1 + rate) ** (t + 1);
        presentValueCents += Math.round(cf.getCents() / denominator);
    }
    const npvCents = presentValueCents - initialInvestment.getCents();
    const isViable = npvCents > 0;
    const magnitude = Math.abs(npvCents);
    const npvMagnitude = magnitude === 0
        ? Money.zero(currency)
        : Money.fromCents(magnitude, currency);
    return {
        npv: npvMagnitude,
        npvCents,
        isViable,
    };
}
//# sourceMappingURL=npv.js.map