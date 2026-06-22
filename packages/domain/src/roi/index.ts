/**
 * ROI Engine — barrel exports
 *
 * @domain Value Objects & Calculators
 */

export {
	calculateRoi,
} from "./roi";

export {
	calculatePaybackPeriod,
} from "./payback-period";

export {
	calculateNpv,
} from "./npv";

export {
	calculateIrr,
} from "./irr";

export type {
	Percentage,
	Confidence,
	RoiInput,
	RoiResult,
	PaybackInput,
	PaybackResult,
	NpvInput,
	NpvResult,
	IrrInput,
	IrrResult,
	RoiScenario,
	ScenarioComparisonResult,
	InvalidFinancialInputError,
} from "./types";
