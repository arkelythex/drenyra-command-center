/**
 * ROI Calculator
 *
 * Calculates Return on Investment as a percentage.
 * ROI = ((CurrentValue - Investment) / Investment) * 100
 *
 * @domain Value Object — framework-free, deterministic
 */

import { Money } from "../value-objects/Money";
import type { RoiInput, RoiResult } from "./types";
import { InvalidFinancialInputError } from "./types";

const DECIMAL_PLACES = 4;

/**
 * Calculate Return on Investment
 *
 * @example
 * ```ts
 * const investment = Money.fromAmount(1000, "PEN");
 * const currentValue = Money.fromAmount(1500, "PEN");
 * const result = calculateRoi({ investment, currentValue });
 * // roiPercentage === 50, netGain === S/ 500
 * ```
 */
export function calculateRoi(input: RoiInput): RoiResult {
	const { investment, currentValue } = input;

	if (investment.isZero()) {
		throw new InvalidFinancialInputError("Investment cannot be zero");
	}

	if (currentValue.lessThan(investment)) {
		// Negative ROI
		const netLoss = investment.subtract(currentValue);
		const ratio = netLoss.getAmount() / investment.getAmount();
		const roiPercentage = -roundToDec(ratio * 100, DECIMAL_PLACES);
		return {
			roiPercentage,
			netGain: Money.zero(investment.getCurrency()),
			interpretation: buildInterpretation(roiPercentage),
		};
	}

	const netGain = currentValue.subtract(investment);
	const ratio = netGain.getAmount() / investment.getAmount();
	const roiPercentage = roundToDec(ratio * 100, DECIMAL_PLACES);

	return {
		roiPercentage,
		netGain,
		interpretation: buildInterpretation(roiPercentage),
	};
}

function roundToDec(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function buildInterpretation(roi: number): string {
	if (roi >= 100) return "Exceptional return — investment more than doubled";
	if (roi >= 50) return "Strong return — significantly above cost of capital";
	if (roi >= 20) return "Good return — well above typical cost of capital";
	if (roi >= 10) return "Moderate return — above cost of capital";
	if (roi >= 0) return "Break-even or marginal return";
	if (roi >= -20) return "Slight loss — within acceptable risk range";
	return "Significant loss — investment underperformed";
}
