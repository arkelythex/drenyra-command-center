/**
 * ROI Engine — Zod v4 validation schemas
 */

import { z } from "zod";

// ── Shared ─────────────────────────────────────────────────────────

const Currency = z.enum(["PEN", "USD"]);

const MoneyInput = z.object({
	amount: z.number().nonnegative("Amount must be non-negative"),
	currency: Currency,
});

// ── ROI Calculation ────────────────────────────────────────────────

const RoiCalculateInput = z.object({
	investment: MoneyInput,
	currentValue: MoneyInput,
});

// ── Payback Period ─────────────────────────────────────────────────

const PaybackInput = z.object({
	initialInvestment: MoneyInput,
	annualCashFlow: MoneyInput,
});

// ── NPV ────────────────────────────────────────────────────────────

const NpvInput = z.object({
	initialInvestment: MoneyInput,
	cashFlows: z.array(MoneyInput).min(1, "At least one cash flow required"),
	discountRate: z
		.number()
		.min(-100)
		.max(1000, "Discount rate must be between -100% and 1000%"),
});

// ── IRR ────────────────────────────────────────────────────────────

const IrrInput = z.object({
	initialInvestment: MoneyInput,
	cashFlows: z.array(MoneyInput).min(1, "At least one cash flow required"),
});

// ── Scenario Comparison ────────────────────────────────────────────

const RoiScenarioInput = z.object({
	name: z.string().min(1).max(100),
	investment: MoneyInput,
	annualCashFlow: MoneyInput,
	projectDurationYears: z.number().positive().max(100),
	discountRate: z.number().min(-100).max(1000),
});

const ScenarioCompareInput = z.object({
	scenarios: z.array(RoiScenarioInput).min(2, "At least 2 scenarios required"),
});

// ── Request body schema ────────────────────────────────────────────

const RoiRequest = z.object({
	type: z.enum(["calculate", "payback", "npv", "irr", "scenario"]),
	calculate: RoiCalculateInput.optional(),
	payback: PaybackInput.optional(),
	npv: NpvInput.optional(),
	irr: IrrInput.optional(),
	scenario: ScenarioCompareInput.optional(),
});

// ── Response schemas ───────────────────────────────────────────────

const RoiCalculateResponse = z.object({
	roiPercentage: z.number(),
	netGain: z.object({ amount: z.number(), currency: Currency }),
	interpretation: z.string(),
});

const PaybackResponse = z.object({
	months: z.number(),
	years: z.number(),
	isInfinite: z.boolean(),
});

const NpvResponse = z.object({
	npv: z.object({ amount: z.number(), currency: Currency }),
	npvCents: z.number(),
	isViable: z.boolean(),
});

const IrrResponse = z.object({
	irr: z.number(),
	converged: z.boolean(),
	iterations: z.number(),
});

// ── Exports ────────────────────────────────────────────────────────

export {
	Currency,
	IrrInput,
	IrrResponse,
	MoneyInput,
	NpvInput,
	NpvResponse,
	PaybackInput,
	PaybackResponse,
	RoiCalculateInput,
	RoiCalculateResponse,
	RoiRequest,
	RoiScenarioInput,
	ScenarioCompareInput,
};
