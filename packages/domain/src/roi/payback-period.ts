/**
 * Payback Period Calculator
 *
 * Calculates how long it takes to recover the initial investment.
 * PaybackPeriod = InitialInvestment / AverageAnnualCashFlow
 *
 * @domain Value Object — framework-free, deterministic
 */

import { Money } from "../value-objects/Money";
import type { PaybackInput, PaybackResult } from "./types";
import { InvalidFinancialInputError } from "./types";

const MONTHS_IN_YEAR = 12;

/**
 * Calculate payback period in fiscal months
 *
 * @example
 * ```ts
 * const investment = Money.fromAmount(120000, "PEN");
 * const annualFlow = Money.fromAmount(40000, "PEN");
 * const result = calculatePaybackPeriod({ initialInvestment: investment, annualCashFlow: annualFlow });
 * // months === 36, years === 3, isInfinite === false
 * ```
 */
export function calculatePaybackPeriod(input: PaybackInput): PaybackResult {
	const { initialInvestment, annualCashFlow } = input;

	if (initialInvestment.isZero()) {
		return { months: 0, years: 0, isInfinite: false };
	}

	if (annualCashFlow.isZero() || annualCashFlow.isNegative()) {
		return { months: Infinity, years: Infinity, isInfinite: true };
	}

	// Months = (Investment / AnnualCashFlow) * 12, rounded up
	const exactMonths =
		(initialInvestment.getAmount() / annualCashFlow.getAmount()) *
		MONTHS_IN_YEAR;
	const months = Math.ceil(exactMonths);
	const years = roundToDec(months / MONTHS_IN_YEAR, 2);

	return { months, years, isInfinite: false };
}

// Use same rounding helper from roi.ts — duplicated here to keep files
// standalone (domain package convention)
function roundToDec(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}
