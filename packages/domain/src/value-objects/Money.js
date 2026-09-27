import { InvalidAmountError } from "../errors/InvalidAmountError";
export class Money {
    cents;
    currency;
    constructor(cents, currency) {
        this.cents = cents;
        this.currency = currency;
        Object.freeze(this);
    }
    static fromAmount(amount, currency) {
        if (!Number.isFinite(amount)) {
            throw new InvalidAmountError(amount, "Amount must be finite");
        }
        if (amount < 0) {
            throw new InvalidAmountError(amount, "Amount cannot be negative");
        }
        const cents = Math.round(amount * 100);
        return new Money(cents, currency);
    }
    static fromCents(cents, currency) {
        if (!Number.isInteger(cents)) {
            throw new InvalidAmountError(cents, "Cents must be an integer");
        }
        return new Money(cents, currency);
    }
    static zero(currency) {
        return new Money(0, currency);
    }
    add(other) {
        this.assertSameCurrency(other);
        return new Money(this.cents + other.cents, this.currency);
    }
    subtract(other) {
        this.assertSameCurrency(other);
        const result = this.cents - other.cents;
        if (result < 0) {
            throw new InvalidAmountError(result / 100, "Subtraction would result in a negative amount");
        }
        return new Money(result, this.currency);
    }
    multiply(factor) {
        if (factor < 0) {
            throw new InvalidAmountError(factor, "Factor cannot be negative");
        }
        const result = Math.round(this.cents * factor);
        return new Money(result, this.currency);
    }
    divide(divisor) {
        if (divisor <= 0) {
            throw new InvalidAmountError(divisor, "Divisor must be positive");
        }
        const result = Math.round(this.cents / divisor);
        return new Money(result, this.currency);
    }
    isZero() {
        return this.cents === 0;
    }
    isNegative() {
        return this.cents < 0;
    }
    isPositive() {
        return this.cents > 0;
    }
    equals(other) {
        if (!other)
            return false;
        return this.cents === other.cents && this.currency === other.currency;
    }
    greaterThan(other) {
        this.assertSameCurrency(other);
        return this.cents > other.cents;
    }
    lessThan(other) {
        this.assertSameCurrency(other);
        return this.cents < other.cents;
    }
    greaterThanOrEqual(other) {
        this.assertSameCurrency(other);
        return this.cents >= other.cents;
    }
    lessThanOrEqual(other) {
        this.assertSameCurrency(other);
        return this.cents <= other.cents;
    }
    getAmount() {
        return this.cents / 100;
    }
    getCents() {
        return this.cents;
    }
    getCurrency() {
        return this.currency;
    }
    toString() {
        return this.getAmount().toFixed(2);
    }
    toNumber() {
        return this.getAmount();
    }
    format(options) {
        const symbol = this.currency === "PEN" ? "S/" : this.currency === "USD" ? "$" : "€";
        const amount = Math.abs(this.getAmount());
        const isNeg = this.isNegative();
        const formattedAmount = amount.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        if (isNeg) {
            if (options?.useParentheses) {
                return `(${symbol} ${formattedAmount})`;
            }
            return `-${symbol} ${formattedAmount}`;
        }
        return `${symbol} ${formattedAmount}`;
    }
    toJSON() {
        return {
            amount: this.getAmount(),
            cents: this.cents,
            currency: this.currency,
        };
    }
    static fromJSON(json) {
        return Money.fromAmount(json.amount, json.currency);
    }
    assertSameCurrency(other) {
        if (this.currency !== other.currency) {
            throw new Error(`Cannot operate on different currencies: ${this.currency} and ${other.currency}`);
        }
    }
}
//# sourceMappingURL=Money.js.map