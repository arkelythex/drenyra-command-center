/**
 * ROI Engine — Application Service
 *
 * Wraps domain calculators for the API layer.
 */

import { Money } from "@arkelythex/domain";
import { calculateRoi, calculatePaybackPeriod, calculateNpv, calculateIrr } from "@arkelythex/domain";
import type { RoiCalculateInputType, PaybackInputType, NpvInputType, IrrInputType, ScenarioCompareInputType, RoiScenarioInputType } from "../../types";

interface ScenarioResult {
	name: string;
	roi: number;
	paybackMonths: number;
	npv: number;
	irr: number | null;
	score: number;
}

function toMoney(input: { amount: number; currency: "PEN" | "USD" }): Money {
	return Money.fromAmount(input.amount, input.currency);
}

export const roiService = {
	calculate(input: RoiCalculateInputType) {
		const result = calculateRoi({
			investment: toMoney(input.investment),
			currentValue: toMoney(input.currentValue),
		});
		return {
			roiPercentage: result.roiPercentage,
			netGain: {
				amount: result.netGain.getAmount(),
				currency: result.netGain.getCurrency(),
			},
			interpretation: result.interpretation,
		};
	},

	payback(input: PaybackInputType) {
		const result = calculatePaybackPeriod({
			initialInvestment: toMoney(input.initialInvestment),
			annualCashFlow: toMoney(input.annualCashFlow),
		});
		return {
			months: result.months,
			years: result.years,
			isInfinite: result.isInfinite,
		};
	},

	npv(input: NpvInputType) {
		const result = calculateNpv({
			initialInvestment: toMoney(input.initialInvestment),
			cashFlows: input.cashFlows.map(toMoney),
			discountRate: input.discountRate,
		});
		return {
			npv: {
				amount: result.npv.getAmount(),
				currency: result.npv.getCurrency(),
			},
			npvCents: result.npvCents,
			isViable: result.isViable,
		};
	},

	irr(input: IrrInputType) {
		const result = calculateIrr({
			initialInvestment: toMoney(input.initialInvestment),
			cashFlows: input.cashFlows.map(toMoney),
		});
		return {
			irr: result.irr,
			converged: result.converged,
			iterations: result.iterations,
		};
	},

	scenario(input: ScenarioCompareInputType) {
		const results: Array<ScenarioResult> = input.scenarios.map((s: RoiScenarioInputType) => {
			const investment = toMoney(s.investment);
			const annualFlow = toMoney(s.annualCashFlow);
			const years = s.projectDurationYears;

			// Generate yearly cash flows (simplified: constant annual flow)
			const cashFlows = Array.from({ length: years }, () => annualFlow);

			const roiResult = calculateRoi({
				investment,
				currentValue: annualFlow.multiply(years).add(investment),
			});

			const paybackResult = calculatePaybackPeriod({
				initialInvestment: investment,
				annualCashFlow: annualFlow,
			});

			const npvResult = calculateNpv({
				initialInvestment: investment,
				cashFlows,
				discountRate: s.discountRate,
			});

			const irrResult = calculateIrr({
				initialInvestment: investment,
				cashFlows,
			});

			// Score: weighted combination of metrics
			const npvScore = npvResult.isViable ? 30 : -30;
			const roiScore = Math.min(roiResult.roiPercentage * 0.3, 30);
			const paybackScore = paybackResult.isInfinite
				? -20
				: Math.max(-20, 20 - paybackResult.months * 0.5);
			const irrScore = irrResult.converged
				? Math.min(irrResult.irr, 20)
				: -10;
			const score = Math.round(npvScore + roiScore + paybackScore + irrScore);

			return {
				name: s.name,
				roi: roiResult.roiPercentage,
				paybackMonths: paybackResult.months,
				npv: npvResult.npvCents,
				irr: irrResult.converged ? irrResult.irr : null,
				score,
			};
		});

		// Sort by score descending, recommend the best
		results.sort((a, b) => b.score - a.score);

		return {
			scenarios: results,
			recommended: results[0]?.name ?? "",
		};
	},
};
