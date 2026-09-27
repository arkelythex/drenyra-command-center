import { type Currency, Money } from "@drenyra/domain/value-objects/Money";
export declare function money(amount: number, currency?: Currency): Money;
export declare function zeroMoney(currency?: Currency): Money;
export declare function moneyFromCents(cents: number, currency?: Currency): Money;
export declare function calculateWithIGV(baseAmount: number, currency?: Currency): {
    base: Money;
    igv: Money;
    total: Money;
};
export declare function extractFromTotalWithIGV(totalAmount: number, currency?: Currency): {
    base: Money;
    igv: Money;
    total: Money;
};
export declare function multiCurrencyAmounts(penAmount: number, usdAmount: number): {
    pen: Money;
    usd: Money;
};
//# sourceMappingURL=money-helpers.d.ts.map