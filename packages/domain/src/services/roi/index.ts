/**
 * ROI Engine — barrel exports
 *
 * @domain Value Objects & Calculators
 */

export { calculateIrr } from "./irr";
export { calculateNpv } from "./npv";
export { calculatePaybackPeriod } from "./payback-period";
export { calculateRoi } from "./roi";

export type {
	Confidence,
	InvalidFinancialInputError,
	IrrInput,
	IrrResult,
	NpvInput,
	NpvResult,
	PaybackInput,
	PaybackResult,
	Percentage,
	RoiInput,
	RoiResult,
	RoiScenario,
	ScenarioComparisonResult,
} from "./types";
