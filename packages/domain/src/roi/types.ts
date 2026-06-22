/**
 * ROI Engine — shared types
 *
 * @domain Value Objects
 * @framework-free
 */

import { Money } from "../value-objects/Money";
import type { Currency } from "../value-objects/Money";

// ── Percentage type ────────────────────────────────────────────────

/** A financial percentage stored as a decimal (e.g. 12.5 = 12.5%) */
export type Percentage = number;

/** Confidence in a projection (0-1) */
export type Confidence = number;

// ── ROI ────────────────────────────────────────────────────────────

export interface RoiInput {
	investment: Money;
	currentValue: Money;
}

export interface RoiResult {
	roiPercentage: Percentage;
	netGain: Money;
	interpretation: string;
}

// ── Payback Period ─────────────────────────────────────────────────

export interface PaybackInput {
	initialInvestment: Money;
	annualCashFlow: Money;
}

export interface PaybackResult {
	months: number;
	years: number;
	isInfinite: boolean;
}

// ── Net Present Value ──────────────────────────────────────────────

export interface NpvInput {
	initialInvestment: Money;
	cashFlows: Money[];
	discountRate: Percentage; // e.g. 10 = 10%
}

export interface NpvResult {
	npv: Money; // absolute magnitude (always >= 0)
	npvCents: number; // raw signed value (can be negative)
	isViable: boolean; // true when NPV > 0
}

// ── Internal Rate of Return ────────────────────────────────────────

export interface IrrInput {
	initialInvestment: Money;
	cashFlows: Money[];
}

export interface IrrResult {
	irr: Percentage;
	converged: boolean;
	iterations: number;
}

// ── Scenario comparison ────────────────────────────────────────────

export interface RoiScenario {
	name: string;
	investment: { amount: number; currency: Currency };
	annualCashFlow: { amount: number; currency: Currency };
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

// ── Calculation errors ─────────────────────────────────────────────

export class InvalidFinancialInputError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidFinancialInputError";
	}
}
