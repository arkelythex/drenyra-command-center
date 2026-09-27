import { Money } from "@drenyra/domain/value-objects/Money";
export function money(amount, currency = "PEN") {
    return Money.fromAmount(amount, currency);
}
export function zeroMoney(currency = "PEN") {
    return Money.zero(currency);
}
export function moneyFromCents(cents, currency = "PEN") {
    return Money.fromCents(cents, currency);
}
export function calculateWithIGV(baseAmount, currency = "PEN") {
    const base = Money.fromAmount(baseAmount, currency);
    const igv = base.multiply(0.18);
    const total = base.add(igv);
    return { base, igv, total };
}
export function extractFromTotalWithIGV(totalAmount, currency = "PEN") {
    const total = Money.fromAmount(totalAmount, currency);
    const base = Money.fromCents(Math.round(total.getCents() / 1.18), currency);
    const igv = total.subtract(base);
    return { base, igv, total };
}
export function multiCurrencyAmounts(penAmount, usdAmount) {
    return {
        pen: Money.fromAmount(penAmount, "PEN"),
        usd: Money.fromAmount(usdAmount, "USD"),
    };
}
//# sourceMappingURL=money-helpers.js.map