import { Money } from "@drenyra/domain";
import type { Currency } from "@drenyra/domain";

function decimalStringToCents(value: string): number {
	const normalized = value.trim();
	const match = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

	if (!match) {
		throw new Error(`Invalid decimal amount: ${value}`);
	}

	const sign = match[1] === "-" ? -1 : 1;
	const whole = Number.parseInt(match[2], 10);
	const fraction = (match[3] ?? "").padEnd(2, "0");
	const cents = Number.parseInt(fraction || "0", 10);

	return sign * (whole * 100 + cents);
}

/**
 * moneyFromDecimalString operation.
 *
 * @param value - Input for value.
 * @param currency - Input for currency.
 * @returns Result of moneyFromDecimalString.
 * @example
 * ```ts
 * const result = moneyFromDecimalString("", {} as Currency);
 * console.log(result);
 * ```
 */
export function moneyFromDecimalString(
	value: string,
	currency: Currency,
): Money {
	return Money.fromCents(decimalStringToCents(value), currency);
}

/**
 * zeroMoney operation.
 *
 * @param currency - Input for currency.
 * @returns Result of zeroMoney.
 * @example
 * ```ts
 * const result = zeroMoney({} as Currency);
 * console.log(result);
 * ```
 */
export function zeroMoney(currency: Currency): Money {
	return Money.zero(currency);
}
