import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import {
	type CashflowTransaction,
	createCashflowPredictorStrategy,
} from "../cashflow-predictor.strategy";

const ctx = {
	tenantId: "t",
	userId: "u",
	organizationId: "o",
	companyId: "c",
	ruc: "20123456789",
	traceId: "x",
} as AgentContext;

/** Deterministic daily series: one income and one expense row per day. */
function series(
	days: number,
	income: (i: number) => number,
	expense: (i: number) => number,
	start = "2026-01-01",
): CashflowTransaction[] {
	const out: CashflowTransaction[] = [];
	for (let i = 0; i < days; i++) {
		const date = new Date(
			new Date(`${start}T00:00:00Z`).getTime() + i * 86_400_000,
		)
			.toISOString()
			.slice(0, 10);
		out.push({
			id: `i${i}`,
			date,
			amount: income(i),
			type: "INCOME",
			category: "ventas",
			description: "v",
		});
		out.push({
			id: `e${i}`,
			date,
			amount: expense(i),
			type: "EXPENSE",
			category: "gastos",
			description: "g",
		});
	}
	return out;
}

const wobble = (i: number, base: number, amp: number) =>
	base + ((i * 37) % 11) * amp - 5 * amp;

const run = (
	data: CashflowTransaction[],
	options?: Parameters<typeof createCashflowPredictorStrategy>[0],
) =>
	createCashflowPredictorStrategy(options).execute(
		data,
		ctx,
	) as import("../types").Anomaly[];

describe("cashflow predictor (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-01T00:00:00.000Z"));
	});
	afterEach(() => vi.useRealTimers());

	const cases: Record<string, CashflowTransaction[]> = {
		"stable (no anomalies expected)": series(
			40,
			(i) => wobble(i, 1000, 2),
			(i) => wobble(i, 600, 2),
		),
		"too few data points": series(
			5,
			() => 1000,
			() => 600,
		),
		"income drops on days 20 and 33": series(
			40,
			(i) => (i === 20 || i === 33 ? 200 : wobble(i, 1000, 5)),
			(i) => wobble(i, 600, 5),
		),
		"expense spikes on days 18 and 30": series(
			40,
			(i) => wobble(i, 1000, 5),
			(i) => (i === 18 || i === 30 ? 2400 : wobble(i, 600, 5)),
		),
		"trend reversal positive -> negative": series(
			40,
			(i) => (i < 20 ? 1500 + (i % 3) : 300 + (i % 3)),
			(i) => 600 + (i % 2),
		),
		"trend reversal negative -> positive": series(
			40,
			(i) => (i < 20 ? 300 + (i % 3) : 1500 + (i % 3)),
			(i) => 600 + (i % 2),
		),
		"z-score outlier": series(
			40,
			(i) => (i === 25 ? 9000 : wobble(i, 1000, 5)),
			(i) => wobble(i, 600, 5),
		),
		"mixed: drop, spike and reversal": series(
			44,
			(i) => (i === 10 ? 100 : i < 22 ? 1400 + (i % 4) : 350 + (i % 4)),
			(i) => (i === 30 ? 2600 : 600 + (i % 3)),
		),
	};

	for (const [name, data] of Object.entries(cases)) {
		it(`pins anomalies: ${name}`, () => {
			expect(run(data)).toMatchSnapshot();
		});
	}

	it("pins custom thresholds", () => {
		const data = series(
			40,
			(i) => (i === 20 ? 200 : wobble(i, 1000, 5)),
			(i) => (i === 18 ? 2400 : wobble(i, 600, 5)),
		);
		expect(
			run(data, {
				zScoreThreshold: 1.5,
				incomeDropRatio: 0.9,
				expenseSpikeRatio: 1.2,
			} as never),
		).toMatchSnapshot();
	});

	it("covers every detector across the scenarios", () => {
		const methods = new Set(
			Object.values(cases).flatMap((d) => run(d).map((a) => a.metric)),
		);
		expect(methods.has("cashflow_income_drop")).toBe(true);
		expect(methods.has("cashflow_expense_spike")).toBe(true);
		expect(methods.has("cashflow_trend_reversal")).toBe(true);
	});
});
