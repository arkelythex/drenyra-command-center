/**
 * Internal Rate of Return (IRR) Calculator
 *
 * IRR is the discount rate that makes NPV = 0:
 *   Σ (CashFlow_t / (1 + IRR)^t) = InitialInvestment
 *
 * Uses Newton's method for iterative approximation with:
 * - Max 1000 iterations
 * - Convergence tolerance of 0.0001%
 * - Initial guess: 10%
 *
 * @domain Value Object — framework-free, deterministic
 */

import type { IrrInput, IrrResult } from "./types";
import { InvalidFinancialInputError } from "./types";

const MAX_ITERATIONS = 1000;
const TOLERANCE = 0.0001; // 0.0001%
const INITIAL_GUESS = 0.1; // 10%
const CASH_FLOW_MINIMUM = 2; // Need at least investment + 1 cash flow

/**
 * Calculate Internal Rate of Return
 *
 * @example
 * ```ts
 * const investment = Money.fromAmount(100000, "PEN");
 * const cf1 = Money.fromAmount(30000, "PEN");
 * const cf2 = Money.fromAmount(40000, "PEN");
 * const cf3 = Money.fromAmount(50000, "PEN");
 * const result = calculateIrr({ initialInvestment: investment, cashFlows: [cf1, cf2, cf3] });
 * ```
 */
export function calculateIrr(input: IrrInput): IrrResult {
	const { initialInvestment, cashFlows } = input;

	if (cashFlows.length < CASH_FLOW_MINIMUM - 1) {
		throw new InvalidFinancialInputError(
			`At least ${CASH_FLOW_MINIMUM - 1} cash flow period is required for IRR calculation`,
		);
	}

	// Convert cash flows to signed cents array: investment is negative (outflow)
	const cashFlowCents = [
		-initialInvestment.getCents(),
		...cashFlows.map((cf) => cf.getCents()),
	];

	// Check if all cash flows are non-positive (IRR doesn't exist)
	const hasPositiveFlow = cashFlowCents.some((cf) => cf > 0);
	if (!hasPositiveFlow) {
		return { irr: -100, converged: false, iterations: 0 };
	}

	let guess = INITIAL_GUESS;

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		let npv = 0;
		let npvDerivative = 0;

		for (let t = 0; t < cashFlowCents.length; t++) {
			const cf = cashFlowCents[t];
			if (cf === undefined) continue;
			const denominator = (1 + guess) ** t;
			npv += cf / denominator;
			npvDerivative += (-t * cf) / (1 + guess) ** (t + 1);
		}

		if (Math.abs(npvDerivative) < 1e-15) {
			// Derivative too small to continue — can't converge further
			break;
		}

		const newGuess = guess - npv / npvDerivative;

		if (Math.abs(newGuess - guess) < TOLERANCE / 100) {
			const irrPercentage = roundToDec(newGuess * 100, 4);
			return {
				irr: irrPercentage,
				converged: true,
				iterations: i + 1,
			};
		}

		guess = newGuess;
	}

	// Did not converge — return best approximation
	const irrPercentage = roundToDec(guess * 100, 4);

	return {
		irr: irrPercentage,
		converged: false,
		iterations: MAX_ITERATIONS,
	};
}

function roundToDec(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}
