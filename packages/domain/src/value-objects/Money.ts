/**
 * Money Value Object.
 *
 * @description Handles currency amounts with absolute precision by avoiding
 * floating-point arithmetic (IEEE 754). It follows the "Cents Pattern"
 * where all amounts are stored as integers representing the smallest unit
 * of the currency (e.g., cents for PEN/USD).
 *
 * @example
 * ```typescript
 * const price = Money.fromAmount(100.50, 'PEN');
 * const tax = price.multiply(0.18);
 * const total = price.add(tax);
 * console.info(total.format()); // "S/ 118.59"
 * ```
 *
 * @domain Value Object
 * @immutable
 * @since 1.0.0
 */

import { InvalidAmountError } from "../errors/InvalidAmountError";

/**
 * Currency type.
 *
 * @example
 * ```ts
 * const value: Currency = {} as Currency;
 * console.log(value);
 * ```
 */
export type Currency = import("../types/currency").Currency;

/**
 * Money value object using the "cents pattern" (integer smallest unit).
 *
 * @throws {InvalidAmountError} When input values are invalid
 *
 * @example
 * ```ts
 * const price = Money.fromAmount(100, "PEN");
 * const tax = price.multiply(0.18);
 * const total = price.add(tax);
 * ```
 */
export class Money {
	// Amount in cents (integer)
	private constructor(
		private readonly cents: number,
		private readonly currency: Currency,
	) {
		Object.freeze(this);
	}

	/**
	 * Create Money from a base decimal amount (e.g., 100.50).
	 *
	 * @param amount - The decimal amount (must be finite).
	 * @param currency - The ISO currency code (PEN or USD).
	 * @returns A new immutable Money instance.
	 * @throws {InvalidAmountError} If amount is NaN or Infinite.
	 *
	 * @example
	 * const price = Money.fromAmount(120.99, 'PEN');
	 */
	static fromAmount(amount: number, currency: Currency): Money {
		if (!Number.isFinite(amount)) {
			throw new InvalidAmountError(amount, "Amount must be finite");
		}
		if (amount < 0) {
			throw new InvalidAmountError(amount, "Amount cannot be negative");
		}

		// Convert to cents (round to avoid floating point issues like 0.1 + 0.2)
		const cents = Math.round(amount * 100);

		return new Money(cents, currency);
	}

	/**
	 * Create Money from the smallest currency unit (cents).
	 *
	 * @param cents - Integer value representing cents.
	 * @param currency - The ISO currency code.
	 * @returns A new immutable Money instance.
	 * @throws {InvalidAmountError} If cents is not an integer.
	 *
	 * @example
	 * const price = Money.fromCents(12099, 'PEN'); // Represents S/ 120.99
	 */
	static fromCents(cents: number, currency: Currency): Money {
		if (!Number.isInteger(cents)) {
			throw new InvalidAmountError(cents, "Cents must be an integer");
		}

		return new Money(cents, currency);
	}

	/**
	 * Create zero money
	 */
	static zero(currency: Currency): Money {
		return new Money(0, currency);
	}

	/**
	 * Adds another Money instance to this one.
	 *
	 * @param other - The Money instance to add.
	 * @returns A new Money instance with the combined sum.
	 * @throws {Error} If currency types are incompatible.
	 *
	 * @edge_case Currencies must match exactly (e.g., cannot add PEN to USD).
	 */
	add(other: Money): Money {
		this.assertSameCurrency(other);
		return new Money(this.cents + other.cents, this.currency);
	}

	/**
	 * Subtract money
	 * @throws {InvalidAmountError} if currencies don't match or result would be negative
	 */
	subtract(other: Money): Money {
		this.assertSameCurrency(other);
		const result = this.cents - other.cents;
		if (result < 0) {
			throw new InvalidAmountError(
				result / 100,
				"Subtraction would result in a negative amount",
			);
		}
		return new Money(result, this.currency);
	}

	/**
	 * Binary multiplication of the amount by a numeric factor.
	 * Uses rounding to the nearest cent to maintain precision.
	 *
	 * @param factor - The numeric multiplier (e.g., 0.18 for tax).
	 * @returns A new rounded Money instance.
	 *
	 * @example
	 * const subtotal = Money.fromAmount(100, 'PEN');
	 * const tax = subtotal.multiply(0.18); // S/ 18.00
	 */
	multiply(factor: number): Money {
		if (factor < 0) {
			throw new InvalidAmountError(factor, "Factor cannot be negative");
		}
		const result = Math.round(this.cents * factor);
		return new Money(result, this.currency);
	}

	/**
	 * Divide by a divisor
	 */
	divide(divisor: number): Money {
		if (divisor <= 0) {
			throw new InvalidAmountError(divisor, "Divisor must be positive");
		}

		const result = Math.round(this.cents / divisor);
		return new Money(result, this.currency);
	}

	/**
	 * Check if amount is zero
	 */
	isZero(): boolean {
		return this.cents === 0;
	}

	/**
	 * Check if amount is negative
	 */
	isNegative(): boolean {
		return this.cents < 0;
	}

	/**
	 * Check if amount is positive
	 */
	isPositive(): boolean {
		return this.cents > 0;
	}

	/**
	 * Compare with another Money
	 */
	equals(other: Money | null | undefined): boolean {
		if (!other) return false;
		return this.cents === other.cents && this.currency === other.currency;
	}

	/**
	 * Check if this is greater than other
	 */
	greaterThan(other: Money): boolean {
		this.assertSameCurrency(other);
		return this.cents > other.cents;
	}

	/**
	 * Check if this is less than other
	 */
	lessThan(other: Money): boolean {
		this.assertSameCurrency(other);
		return this.cents < other.cents;
	}

	/**
	 * Check if this is greater than or equal to other
	 */
	greaterThanOrEqual(other: Money): boolean {
		this.assertSameCurrency(other);
		return this.cents >= other.cents;
	}

	/**
	 * Check if this is less than or equal to other
	 */
	lessThanOrEqual(other: Money): boolean {
		this.assertSameCurrency(other);
		return this.cents <= other.cents;
	}

	/**
	 * Get amount as decimal number
	 */
	getAmount(): number {
		return this.cents / 100;
	}

	/**
	 * Get amount in cents (for database storage)
	 */
	getCents(): number {
		return this.cents;
	}

	/**
	 * Get currency
	 */
	getCurrency(): Currency {
		return this.currency;
	}

	/**
	 * Convert to decimal string (e.g., "100.00")
	 * Used for API serialization and database storage.
	 *
	 * @returns Decimal string with 2 decimal places
	 * @example
	 * const price = Money.fromAmount(100, 'PEN');
	 * console.log(price.toString()); // "100.00"
	 */
	toString(): string {
		return this.getAmount().toFixed(2);
	}

	/**
	 * Convert to number (for calculations)
	 *
	 * @returns Decimal number
	 * @example
	 * const price = Money.fromAmount(100.5, 'PEN');
	 * console.log(price.toNumber()); // 100.5
	 */
	toNumber(): number {
		return this.getAmount();
	}

	/**
	 * Format for display
	 * Example: "S/ 1,234.56" or "$ 1,234.56"
	 */
	format(options?: { useParentheses?: boolean }): string {
		const symbol =
			this.currency === "PEN" ? "S/" : this.currency === "USD" ? "$" : "€";
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

	/**
	 * Convert to JSON for serialization
	 */
	toJSON() {
		return {
			amount: this.getAmount(),
			cents: this.cents,
			currency: this.currency,
		};
	}

	/**
	 * Create from JSON
	 */
	static fromJSON(json: { amount: number; currency: Currency }): Money {
		return Money.fromAmount(json.amount, json.currency);
	}

	private assertSameCurrency(other: Money): void {
		if (this.currency !== other.currency) {
			throw new Error(
				`Cannot operate on different currencies: ${this.currency} and ${other.currency}`,
			);
		}
	}
}
