/**
 * Money helpers for test scenarios.
 *
 * Provides utilities for creating Money value objects and
 * performing common monetary calculations in tests.
 */
import { Money, type Currency } from "@arkelythex/domain/value-objects/Money";

/**
 * Create Money from a decimal amount.
 *
 * @example
 * ```ts
 * const price = money(100.50); // S/ 100.50
 * ```
 */
export function money(amount: number, currency: Currency = "PEN"): Money {
	return Money.fromAmount(amount, currency);
}

/**
 * Create zero Money.
 */
export function zeroMoney(currency: Currency = "PEN"): Money {
	return Money.zero(currency);
}

/**
 * Create Money from cents.
 */
export function moneyFromCents(
	cents: number,
	currency: Currency = "PEN",
): Money {
	return Money.fromCents(cents, currency);
}

/**
 * Calculate IGV (18%) for a given base amount.
 *
 * @param baseAmount - Base amount before tax
 * @param currency - Currency
 * @returns Object with base, igv, and total
 */
export function calculateWithIGV(
	baseAmount: number,
	currency: Currency = "PEN",
): { base: Money; igv: Money; total: Money } {
	const base = Money.fromAmount(baseAmount, currency);
	const igv = base.multiply(0.18);
	const total = base.add(igv);
	return { base, igv, total };
}

/**
 * Extract base amount from a total that includes IGV.
 *
 * @param totalAmount - Total amount including IGV
 * @param currency - Currency
 * @returns Object with base, igv, and total
 */
export function extractFromTotalWithIGV(
	totalAmount: number,
	currency: Currency = "PEN",
): { base: Money; igv: Money; total: Money } {
	const total = Money.fromAmount(totalAmount, currency);
	const base = Money.fromCents(Math.round(total.getCents() / 1.18), currency);
	const igv = total.subtract(base);
	return { base, igv, total };
}

/**
 * Create a set of Money amounts for testing multi-currency scenarios.
 */
export function multiCurrencyAmounts(
	penAmount: number,
	usdAmount: number,
): {
	pen: Money;
	usd: Money;
} {
	return {
		pen: Money.fromAmount(penAmount, "PEN"),
		usd: Money.fromAmount(usdAmount, "USD"),
	};
}
