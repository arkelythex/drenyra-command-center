import type { PeruLoanScenario } from "./CompareLoansView.types";

export const DEFAULT_SCENARIO_A: PeruLoanScenario = {
	id: "A",
	bankName: "BCP / INTERBANK",
	amount: 450000,
	propertyValue: 500000,
	tea: 8.5,
	termYears: 20,
	desgravamenRate: 0.028,
	riskInsuranceRate: 0.025,
	currency: "PEN",
};

export const DEFAULT_SCENARIO_B: PeruLoanScenario = {
	id: "B",
	bankName: "CAJA MUNICIPAL",
	amount: 450000,
	propertyValue: 500000,
	tea: 12.0,
	termYears: 20,
	desgravamenRate: 0.05,
	riskInsuranceRate: 0.03,
	currency: "PEN",
};
