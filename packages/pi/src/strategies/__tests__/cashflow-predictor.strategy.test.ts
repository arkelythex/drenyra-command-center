import { describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { CashflowTransaction } from "../cashflow-predictor.strategy";
import {
	createCashflowPredictorStrategy,
	DEFAULT_ZSCORE_THRESHOLD,
	EXPENSE_SPIKE_RATIO,
	INCOME_DROP_RATIO,
	MIN_DATA_POINTS,
	ROLLING_WINDOW_DAYS,
	TREND_WINDOW_DAYS,
} from "../cashflow-predictor.strategy";

const mockContext: AgentContext = {
	tenantId: "test",
	userId: "test",
	organizationId: "test",
	companyId: "test",
	ruc: "20123456789",
	traceId: "test",
};

// ─── Helpers ───────────────────────────────────────────────────────

function makeTx(
	overrides: Partial<CashflowTransaction> = {},
): CashflowTransaction {
	return {
		id: "TX-001",
		date: "2026-01-15",
		amount: 1000,
		type: "INCOME",
		category: "ventas",
		description: "Venta de servicios",
		...overrides,
	};
}

function generateStableDaily(
	startDate: string,
	days: number,
	income: number,
	expense: number,
): CashflowTransaction[] {
	const txs: CashflowTransaction[] = [];
	for (let i = 0; i < days; i++) {
		const d = new Date(
			new Date(startDate + "T00:00:00").getTime() + i * 86400000,
		);
		const dateStr = d.toISOString().slice(0, 10);
		txs.push(
			makeTx({
				id: `inc-${i}`,
				date: dateStr,
				amount: income,
				type: "INCOME",
				category: "ventas",
			}),
		);
		txs.push(
			makeTx({
				id: `exp-${i}`,
				date: dateStr,
				amount: expense,
				type: "EXPENSE",
				category: "gastos",
			}),
		);
	}
	return txs;
}

function generateWithAnomaly(
	startDate: string,
	days: number,
	normalIncome: number,
	normalExpense: number,
	anomalyDay: number,
	anomalyIncome?: number,
	anomalyExpense?: number,
): CashflowTransaction[] {
	const txs: CashflowTransaction[] = [];
	for (let i = 0; i < days; i++) {
		const d = new Date(
			new Date(startDate + "T00:00:00").getTime() + i * 86400000,
		);
		const dateStr = d.toISOString().slice(0, 10);
		const inc =
			i === anomalyDay && anomalyIncome !== undefined
				? anomalyIncome
				: normalIncome;
		const exp =
			i === anomalyDay && anomalyExpense !== undefined
				? anomalyExpense
				: normalExpense;
		txs.push(
			makeTx({
				id: `inc-${i}`,
				date: dateStr,
				amount: inc,
				type: "INCOME",
				category: "ventas",
			}),
		);
		txs.push(
			makeTx({
				id: `exp-${i}`,
				date: dateStr,
				amount: exp,
				type: "EXPENSE",
				category: "gastos",
			}),
		);
	}
	return txs;
}

function generateTrendReversal(
	startDate: string,
	days: number,
	positiveNet: number,
	negativeNet: number,
	splitDay: number,
): CashflowTransaction[] {
	const txs: CashflowTransaction[] = [];
	for (let i = 0; i < days; i++) {
		const d = new Date(
			new Date(startDate + "T00:00:00").getTime() + i * 86400000,
		);
		const dateStr = d.toISOString().slice(0, 10);
		const isPositive = i < splitDay;
		const net = isPositive ? positiveNet : negativeNet;
		txs.push(
			makeTx({
				id: `tx-${i}`,
				date: dateStr,
				amount: net > 0 ? net : 100,
				type: "INCOME",
				category: "ventas",
			}),
		);
		txs.push(
			makeTx({
				id: `tx-exp-${i}`,
				date: dateStr,
				amount: net > 0 ? 500 : 500 - net,
				type: "EXPENSE",
				category: "gastos",
			}),
		);
	}
	return txs;
}

// ─── Strategy metadata ─────────────────────────────────────────────

describe("createCashflowPredictorStrategy", () => {
	const strategy = createCashflowPredictorStrategy();

	it("should return correct strategy metadata", () => {
		expect(strategy.id).toBe("cashflow-predictor");
		expect(strategy.name).toContain("Cashflow");
		expect(strategy.minSeverity).toBe("low");
	});

	it("should export default constants", () => {
		expect(DEFAULT_ZSCORE_THRESHOLD).toBe(2.0);
		expect(ROLLING_WINDOW_DAYS).toBe(7);
		expect(INCOME_DROP_RATIO).toBe(0.7);
		expect(EXPENSE_SPIKE_RATIO).toBe(1.5);
		expect(MIN_DATA_POINTS).toBe(7);
		expect(TREND_WINDOW_DAYS).toBe(14);
	});

	it("should return empty array for non-array data", () => {
		expect(strategy.execute(null, mockContext)).toEqual([]);
		expect(strategy.execute(undefined, mockContext)).toEqual([]);
		expect(strategy.execute("not an array", mockContext)).toEqual([]);
	});

	it("should return empty array for insufficient data", () => {
		const fewTxs = [makeTx(), makeTx()]; // only 2 transactions, need {#MIN_DATA_POINTS}
		const anomalies = strategy.execute(fewTxs, mockContext);
		expect(anomalies).toEqual([]);
	});

	// ─── Z-score Outliers ─────────────────────────────────

	describe("z-score outlier detection", () => {
		it("should not flag stable cashflow (no outliers)", () => {
			const txs = generateStableDaily("2026-01-01", 14, 2000, 1500);
			const anomalies = strategy.execute(txs, mockContext);
			const zscoreAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_zscore_statistical",
			);
			expect(zscoreAnomalies).toHaveLength(0);
		});

		it("should flag day with extreme outlier (high z-score)", () => {
			const txs = generateWithAnomaly(
				"2026-01-01",
				14,
				2000,
				1500, // normal
				7, // anomaly day
				10000,
				undefined, // huge income spike
			);
			const anomalies = strategy.execute(txs, mockContext);
			const zscoreAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_zscore_statistical",
			);
			expect(zscoreAnomalies.length).toBeGreaterThan(0);

			// The day with the spike should be flagged
			const day7Anomaly = zscoreAnomalies.find(
				(a) => a.entityId === "2026-01-08",
			);
			expect(day7Anomaly).toBeDefined();
			if (day7Anomaly) {
				expect(day7Anomaly.metric).toBe("cashflow_zscore");
				expect(day7Anomaly.severity).toMatch(/medium|high|critical/);
			}
		});

		it("should flag day with huge expense as outlier", () => {
			const txs = generateWithAnomaly(
				"2026-01-01",
				14,
				2000,
				1500, // normal
				5,
				undefined,
				30000, // massive expense
			);
			const anomalies = strategy.execute(txs, mockContext);
			const zscoreAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_zscore_statistical",
			);
			expect(zscoreAnomalies.length).toBeGreaterThan(0);
		});

		it("should include z-score context data", () => {
			const txs = generateWithAnomaly(
				"2026-01-01",
				14,
				2000,
				1500,
				3,
				15000,
				undefined,
			);
			const anomalies = strategy.execute(txs, mockContext);
			const zs = anomalies.find(
				(a) => a.detectionMethod === "cashflow_zscore_statistical",
			);
			expect(zs).toBeDefined();
			if (zs) {
				expect(typeof zs.context.zScore).toBe("number");
				expect(typeof zs.context.avgNet).toBe("number");
				expect(typeof zs.context.stdNet).toBe("number");
				expect(zs.context.threshold).toBe(DEFAULT_ZSCORE_THRESHOLD);
			}
		});
	});

	// ─── Trend Reversal ───────────────────────────────────

	describe("trend reversal detection", () => {
		it("should not flag stable trend", () => {
			const txs = generateStableDaily("2026-01-01", 20, 2000, 1500);
			const anomalies = strategy.execute(txs, mockContext);
			const trendAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_trend_reversal",
			);
			expect(trendAnomalies).toHaveLength(0);
		});

		it("should flag reversal when trend changes positive→negative", () => {
			// First 15 days: net positive (2000 income, 500 expense)
			// Last 15 days: net negative (1000 income, 3000 expense)
			const txs1 = generateStableDaily("2026-01-01", 15, 2000, 500);
			const txs2 = generateStableDaily("2026-01-16", 15, 1000, 3000);
			const txs = [...txs1, ...txs2];

			const anomalies = strategy.execute(txs, mockContext);
			const trendAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_trend_reversal",
			);
			expect(trendAnomalies).toHaveLength(1);
			expect(trendAnomalies[0].metric).toBe("cashflow_trend_reversal");
		});

		it("should not flag reversal with fewer than TREND_WINDOW_DAYS data points", () => {
			const txs = generateStableDaily("2026-01-01", 10, 2000, 1500);
			const anomalies = strategy.execute(txs, mockContext);
			const trendAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_trend_reversal",
			);
			expect(trendAnomalies).toHaveLength(0);
		});

		it("should respect detectTrendReversal: false option", () => {
			const txs1 = generateStableDaily("2026-01-01", 15, 2000, 500);
			const txs2 = generateStableDaily("2026-01-16", 15, 1000, 3000);
			const txs = [...txs1, ...txs2];

			const strategyOptOut = createCashflowPredictorStrategy({
				detectTrendReversal: false,
			});
			const anomalies = strategyOptOut.execute(txs, mockContext);
			const trendAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_trend_reversal",
			);
			expect(trendAnomalies).toHaveLength(0);
		});
	});

	// ─── Income Drops ─────────────────────────────────────

	describe("income drop detection", () => {
		it("should not flag when income is stable", () => {
			const txs = generateStableDaily("2026-01-01", 14, 2000, 1500);
			const anomalies = strategy.execute(txs, mockContext);
			const incomeAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_income_drop_rolling",
			);
			expect(incomeAnomalies).toHaveLength(0);
		});

		it("should flag drastic income drop (>50%)", () => {
			const txs = generateWithAnomaly(
				"2026-01-01",
				14,
				2000,
				1500,
				10, // day to drop income
				200, // income drops to 200 (90% below avg 2000)
				undefined,
			);
			const anomalies = strategy.execute(txs, mockContext);
			const incomeAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_income_drop_rolling",
			);
			expect(incomeAnomalies.length).toBeGreaterThan(0);
			const incomeDrop = incomeAnomalies.find(
				(a) => a.entityId === "2026-01-11",
			);
			expect(incomeDrop).toBeDefined();
		});

		it("should include income drop context data", () => {
			const txs = generateWithAnomaly(
				"2026-01-01",
				14,
				2000,
				1500,
				10,
				200,
				undefined,
			);
			const anomalies = strategy.execute(txs, mockContext);
			const incomeAnomaly = anomalies.find(
				(a) => a.detectionMethod === "cashflow_income_drop_rolling",
			);
			expect(incomeAnomaly).toBeDefined();
			if (incomeAnomaly) {
				expect(typeof incomeAnomaly.context.dailyIncome).toBe("number");
				expect(typeof incomeAnomaly.context.rollingAvgIncome).toBe("number");
				expect(typeof incomeAnomaly.context.dropPercent).toBe("number");
			}
		});
	});

	// ─── Expense Spikes ───────────────────────────────────

	describe("expense spike detection", () => {
		it("should not flag when expenses are stable", () => {
			const txs = generateStableDaily("2026-01-01", 14, 2000, 1500);
			const anomalies = strategy.execute(txs, mockContext);
			const expenseAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_expense_spike_rolling",
			);
			expect(expenseAnomalies).toHaveLength(0);
		});

		it("should flag massive expense spike (3x normal)", () => {
			const txs = generateWithAnomaly(
				"2026-01-01",
				14,
				2000,
				1500,
				5,
				undefined,
				6000, // 4x normal expense
			);
			const anomalies = strategy.execute(txs, mockContext);
			const expenseAnomalies = anomalies.filter(
				(a) => a.detectionMethod === "cashflow_expense_spike_rolling",
			);
			expect(expenseAnomalies.length).toBeGreaterThan(0);
		});

		it("should include expense spike context data", () => {
			const txs = generateWithAnomaly(
				"2026-01-01",
				14,
				2000,
				1500,
				5,
				undefined,
				6000,
			);
			const anomalies = strategy.execute(txs, mockContext);
			const spikeAnomaly = anomalies.find(
				(a) => a.detectionMethod === "cashflow_expense_spike_rolling",
			);
			expect(spikeAnomaly).toBeDefined();
			if (spikeAnomaly) {
				expect(typeof spikeAnomaly.context.dailyExpense).toBe("number");
				expect(typeof spikeAnomaly.context.rollingAvgExpense).toBe("number");
				expect(typeof spikeAnomaly.context.spikePercent).toBe("number");
			}
		});
	});

	// ─── Multiple anomaly types ───────────────────────────

	describe("multiple anomaly types", () => {
		it("should detect both outlier and income drop on same day", () => {
			// Day with both huge income (anomalous high) AND then income drop?
			// Actually let's create two separate anomalies
			const txs = generateWithAnomaly(
				"2026-01-01",
				20,
				2000,
				1500,
				12, // day to create anomaly
				200, // income drops 90%
				undefined,
			);
			const anomalies = strategy.execute(txs, mockContext);
			const detectionMethods = new Set(anomalies.map((a) => a.detectionMethod));
			expect(detectionMethods.has("cashflow_income_drop_rolling")).toBe(true);
			expect(detectionMethods.has("cashflow_zscore_statistical")).toBe(true);
		});
	});

	// ─── Edge cases ───────────────────────────────────────

	describe("edge cases", () => {
		it("should handle all income, no expenses", () => {
			const txs: CashflowTransaction[] = [];
			for (let i = 0; i < 14; i++) {
				const d = new Date(Date.UTC(2026, 0, 1 + i));
				const dateStr = d.toISOString().slice(0, 10);
				txs.push(
					makeTx({
						id: `inc-${i}`,
						date: dateStr,
						amount: 1000,
						type: "INCOME",
						category: "ventas",
					}),
				);
			}
			const anomalies = strategy.execute(txs, mockContext);
			// Should not crash — expense rolling stats will be null, skipped
			expect(Array.isArray(anomalies)).toBe(true);
		});

		it("should handle all expenses, no income", () => {
			const txs: CashflowTransaction[] = [];
			for (let i = 0; i < 14; i++) {
				const d = new Date(Date.UTC(2026, 0, 1 + i));
				const dateStr = d.toISOString().slice(0, 10);
				txs.push(
					makeTx({
						id: `exp-${i}`,
						date: dateStr,
						amount: 1000,
						type: "EXPENSE",
						category: "gastos",
					}),
				);
			}
			const anomalies = strategy.execute(txs, mockContext);
			expect(Array.isArray(anomalies)).toBe(true);
		});

		it("should handle zero values without crashing", () => {
			const txs: CashflowTransaction[] = [];
			for (let i = 0; i < 14; i++) {
				const d = new Date(Date.UTC(2026, 0, 1 + i));
				const dateStr = d.toISOString().slice(0, 10);
				txs.push(
					makeTx({
						id: `tx-${i}`,
						date: dateStr,
						amount: 0,
						type: "INCOME",
						category: "ventas",
					}),
				);
				txs.push(
					makeTx({
						id: `tx-exp-${i}`,
						date: dateStr,
						amount: 0,
						type: "EXPENSE",
						category: "gastos",
					}),
				);
			}
			const anomalies = strategy.execute(txs, mockContext);
			expect(Array.isArray(anomalies)).toBe(true);
		});
	});
});
