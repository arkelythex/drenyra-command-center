import type { CurrencyCode } from "../types/domain/currency";
export type Currency = CurrencyCode;
export declare class Money {
    private readonly cents;
    private readonly currency;
    private constructor();
    static fromAmount(amount: number, currency: Currency): Money;
    static fromCents(cents: number, currency: Currency): Money;
    static zero(currency: Currency): Money;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(factor: number): Money;
    divide(divisor: number): Money;
    isZero(): boolean;
    isNegative(): boolean;
    isPositive(): boolean;
    equals(other: Money | null | undefined): boolean;
    greaterThan(other: Money): boolean;
    lessThan(other: Money): boolean;
    greaterThanOrEqual(other: Money): boolean;
    lessThanOrEqual(other: Money): boolean;
    getAmount(): number;
    getCents(): number;
    getCurrency(): Currency;
    toString(): string;
    toNumber(): number;
    format(options?: {
        useParentheses?: boolean;
    }): string;
    toJSON(): {
        amount: number;
        cents: number;
        currency: CurrencyCode;
    };
    static fromJSON(json: {
        amount: number;
        currency: Currency;
    }): Money;
    private assertSameCurrency;
}
//# sourceMappingURL=money.d.ts.map