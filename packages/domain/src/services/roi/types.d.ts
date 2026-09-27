import type { Currency, Money } from "../../value-objects/Money";
export type Percentage = number;
export type Confidence = number;
export interface RoiInput {
    investment: Money;
    currentValue: Money;
}
export interface RoiResult {
    roiPercentage: Percentage;
    netGain: Money;
    interpretation: string;
}
export interface PaybackInput {
    initialInvestment: Money;
    annualCashFlow: Money;
}
export interface PaybackResult {
    months: number;
    years: number;
    isInfinite: boolean;
}
export interface NpvInput {
    initialInvestment: Money;
    cashFlows: Money[];
    discountRate: Percentage;
}
export interface NpvResult {
    npv: Money;
    npvCents: number;
    isViable: boolean;
}
export interface IrrInput {
    initialInvestment: Money;
    cashFlows: Money[];
}
export interface IrrResult {
    irr: Percentage;
    converged: boolean;
    iterations: number;
}
export interface RoiScenario {
    name: string;
    investment: {
        amount: number;
        currency: Currency;
    };
    annualCashFlow: {
        amount: number;
        currency: Currency;
    };
    projectDurationYears: number;
    discountRate: Percentage;
}
export interface ScenarioComparisonResult {
    scenarios: Array<{
        name: string;
        roi: Percentage;
        paybackMonths: number;
        npv: number;
        irr: Percentage | null;
        score: number;
    }>;
    recommended: string;
}
export declare class InvalidFinancialInputError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=types.d.ts.map