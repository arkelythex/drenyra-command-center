/**
 * Net Present Value (NPV) Calculator
 *
 * NPV = -InitialInvestment + Σ (CashFlow_t / (1 + r)^t)
 *
 * A positive NPV indicates the investment is expected to generate value
 * above the cost of capital. A negative NPV indicates value destruction.
 *
 * @domain Value Object — framework-free, deterministic
 */

import { Money } from "../../value-objects/Money";

import type { NpvInput, NpvResult } from "./types";
import { InvalidFinancialInputError } from "./types";

/**
 * Calculate Net Present Value
 *
 * Money VO enforces non-negative amounts, so NPV uses a dual representation:
 * - `npvCents` — raw signed value (positive or negative)
 * - `npv` — absolute magnitude as Money (always >= 0)
 * - `isViable` — true when NPV > 0
 *
 * @example
 * ```ts
 * const investment = Money.fromAmount(100000, "PEN");
 * const cf1 = Money.fromAmount(30000, "PEN");
 * const cf2 = Money.fromAmount(40000, "PEN");
 * const cf3 = Money.fromAmount(50000, "PEN");
 * const result = calculateNpv({
 *   initialInvestment: investment,
 *   cashFlows: [cf1, cf2, cf3],
 *   discountRate: 10,
 * });
 * ```
 */
export function calculateNpv(input: NpvInput): NpvResult {
	const { initialInvestment, cashFlows, discountRate } = input;

	if (cashFlows.length === 0) {
		throw new InvalidFinancialInputError("At least one cash flow is required");
	}

	if (discountRate < -100) {
		throw new InvalidFinancialInputError(
			"Discount rate cannot be less than -100%",
		);
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

	// Money only stores non-negative amounts: use absolute magnitude
	const magnitude = Math.abs(npvCents);
	const npvMagnitude =
		magnitude === 0
			? Money.zero(currency)
			: Money.fromCents(magnitude, currency);

	return {
		npv: npvMagnitude,
		npvCents,
		isViable,
	};
}
