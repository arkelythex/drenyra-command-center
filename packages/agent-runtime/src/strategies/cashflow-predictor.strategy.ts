/**
 * Cashflow Predictor Strategy — detects anomalies in cashflow patterns
 *
 * Detects four types of cashflow anomalies:
 *   1. Statistical outliers (z-score) — daily net beyond configurable std threshold
 *   2. Trend reversal — change from positive avg to negative avg (or vice versa)
 *   3. Income drop — daily income > 30% below 7-day rolling average
 *   4. Expense spike — daily expense > 50% above 7-day rolling average
 *
 * Based on the data-engine's Python CashflowAnalyzer (scikit-learn z-score),
 * ported to pure TypeScript for direct integration with FiscalAnomalyEngine.
 *
 * Legal/operational relevance:
 *   - Sudden income drops may indicate client payment delays or disputes
 *   - Expense spikes may indicate fraud, unauthorized spending, or error
 *   - Trend reversals signal structural changes in business operations
 */

import type { AgentContext } from "../types/agent-context";
import type { Anomaly, AnomalySeverity, AnomalyStrategy } from "./types";

// ─── Constants ─────────────────────────────────────────────────────

/** Default z-score threshold for statistical outlier detection */
export const DEFAULT_ZSCORE_THRESHOLD = 2.0;

/** Rolling average window in days for income/expense anomaly detection */
export const ROLLING_WINDOW_DAYS = 7;

/** Income drop threshold: daily income below this fraction of rolling average */
export const INCOME_DROP_RATIO = 0.7; // 30% drop

/** Expense spike threshold: daily expense above this multiple of rolling average */
export const EXPENSE_SPIKE_RATIO = 1.5; // 50% spike

/** Minimum number of data points needed for meaningful analysis */
export const MIN_DATA_POINTS = 7;

/** Minimum days of data required for trend reversal detection */
export const TREND_WINDOW_DAYS = 14;

// ─── Input types ──────────────────────────────────────────────────

export interface CashflowTransaction {
	id: string;
	date: string; // YYYY-MM-DD
	amount: number;
	type: "INCOME" | "EXPENSE";
	category: string;
	description?: string;
}

export interface CashflowPredictorOptions {
	/** Z-score threshold for statistical outlier detection (default: 2.0) */
	zscoreThreshold?: number;

	/** Rolling window in days for moving averages (default: 7) */
	rollingWindowDays?: number;

	/** Income drop ratio (default: 0.7 = 30% below average) */
	incomeDropRatio?: number;

	/** Expense spike ratio (default: 1.5 = 50% above average) */
	expenseSpikeRatio?: number;

	/** Enable trend reversal detection (default: true) */
	detectTrendReversal?: boolean;
}

// ─── Internal types ────────────────────────────────────────────────

interface DailyAggregate {
	date: string;
	dateObj: Date;
	income: number;
	expense: number;
	net: number;
}

interface RollingStats {
	avgIncome: number | null;
	stdIncome: number | null;
	avgExpense: number | null;
	stdExpense: number | null;
}

// ─── Strategy factory ─────────────────────────────────────────────

export function createCashflowPredictorStrategy(
	options: CashflowPredictorOptions = {},
): AnomalyStrategy {
	const {
		zscoreThreshold = DEFAULT_ZSCORE_THRESHOLD,
		rollingWindowDays = ROLLING_WINDOW_DAYS,
		incomeDropRatio = INCOME_DROP_RATIO,
		expenseSpikeRatio = EXPENSE_SPIKE_RATIO,
		detectTrendReversal = true,
	} = options;

	return {
		id: "cashflow-predictor",
		name: "Cashflow Anomaly Detection",
		description:
			"Detects cashflow anomalies: statistical outliers (z-score), trend reversals," +
			" income drops, and expense spikes. Based on data-engine CashflowAnalyzer port.",
		minSeverity: "low",

		execute(data: unknown, _context: AgentContext): Anomaly[] {
			if (!Array.isArray(data)) return [];
			if (data.length < MIN_DATA_POINTS) return [];

			const transactions = data as CashflowTransaction[];
			const daily = aggregateDaily(transactions, rollingWindowDays);

			if (daily.length < MIN_DATA_POINTS) return [];

			const anomalies: Anomaly[] = [];

			// 1. Statistical outliers (z-score)
			const zScoreAnomalies = detectZScoreOutliers(daily, zscoreThreshold);
			anomalies.push(...zScoreAnomalies);

			// 2. Trend reversal
			if (detectTrendReversal && daily.length >= TREND_WINDOW_DAYS) {
				const trendAnomalies = detectTrendReversalAnomalies(daily);
				anomalies.push(...trendAnomalies);
			}

			// 3. Income drops
			const incomeDrops = detectIncomeDrops(daily, incomeDropRatio);
			anomalies.push(...incomeDrops);

			// 4. Expense spikes
			const expenseSpikes = detectExpenseSpikes(daily, expenseSpikeRatio);
			anomalies.push(...expenseSpikes);

			return anomalies;
		},
	};
}

// ─── Aggregation helpers ──────────────────────────────────────────

function aggregateDaily(
	transactions: CashflowTransaction[],
	windowDays: number,
): DailyAggregate[] {
	// Group by date
	const dateMap = new Map<string, { income: number; expense: number }>();

	for (const tx of transactions) {
		const existing = dateMap.get(tx.date) ?? { income: 0, expense: 0 };
		if (tx.type === "INCOME") {
			existing.income += tx.amount;
		} else {
			existing.expense += tx.amount;
		}
		dateMap.set(tx.date, existing);
	}

	// Sort by date
	const sorted = Array.from(dateMap.entries())
		.map(([date, { income, expense }]) => ({
			date,
			dateObj: new Date(date + "T00:00:00"),
			income,
			expense,
			net: income - expense,
		}))
		.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

	// At this point we have all dates sorted.
	// For rolling calculations we use a sliding window.
	return sorted;
}

function computeRollingStats(
	daily: DailyAggregate[],
	index: number,
	windowDays: number,
): RollingStats {
	const start = Math.max(0, index - windowDays + 1);
	if (index - start < 2) {
		return {
			avgIncome: null,
			stdIncome: null,
			avgExpense: null,
			stdExpense: null,
		};
	}

	const incomes = daily.slice(start, index).map((d) => d.income);
	const expenses = daily.slice(start, index).map((d) => d.expense);

	const avgIncome = mean(incomes);
	const stdIncome = stdDev(incomes, avgIncome);
	const avgExpense = mean(expenses);
	const stdExpense = stdDev(expenses, avgExpense);

	return { avgIncome, stdIncome, avgExpense, stdExpense };
}

// ─── Detection helpers ────────────────────────────────────────────

function detectZScoreOutliers(
	daily: DailyAggregate[],
	threshold: number,
): Anomaly[] {
	const netValues = daily.map((d) => d.net);
	const avgNet = mean(netValues);
	const stdNet = stdDev(netValues, avgNet);

	if (stdNet === 0) return [];

	const anomalies: Anomaly[] = [];

	for (const day of daily) {
		const zScore = stdNet > 0 ? (day.net - avgNet) / stdNet : 0;

		if (Math.abs(zScore) <= threshold) continue;

		const severity = classifyZScoreSeverity(Math.abs(zScore));
		const confidence = computeZScoreConfidence(Math.abs(zScore));

		anomalies.push({
			id: `cashflow-zscore-${day.date}`,
			timestamp: new Date().toISOString(),
			entityType: "cashflow_day",
			entityId: day.date,
			metric: "cashflow_zscore",
			expectedValue: round2(avgNet),
			actualValue: round2(day.net),
			deviation: round2(Math.abs(zScore)),
			severity,
			confidence,
			reasoning:
				`Flujo neto del día ${day.date}: S/ ${round2(day.net).toLocaleString("es-PE")}. ` +
				`Promedio: S/ ${round2(avgNet).toLocaleString("es-PE")}. ` +
				`Z-score: ${round2(zScore)} (umbral: ${threshold}). ` +
				`Ingresos: S/ ${round2(day.income).toLocaleString("es-PE")}, ` +
				`Egresos: S/ ${round2(day.expense).toLocaleString("es-PE")}.`,
			detectionMethod: "cashflow_zscore_statistical",
			context: {
				date: day.date,
				zScore: round2(zScore),
				avgNet: round2(avgNet),
				stdNet: round2(stdNet),
				income: round2(day.income),
				expense: round2(day.expense),
				threshold,
			},
		});
	}

	return anomalies;
}

function detectTrendReversalAnomalies(daily: DailyAggregate[]): Anomaly[] {
	const anomalies: Anomaly[] = [];

	// Split into two halves: recent vs prior
	const mid = Math.floor(daily.length / 2);
	const priorHalf = daily.slice(0, mid);
	const recentHalf = daily.slice(mid);

	const priorAvgNet = mean(priorHalf.map((d) => d.net));
	const recentAvgNet = mean(recentHalf.map((d) => d.net));

	// Trend reversal: prior positive → recent negative OR prior negative → recent positive
	const priorDirection = priorAvgNet >= 0 ? "positive" : "negative";
	const recentDirection = recentAvgNet >= 0 ? "positive" : "negative";

	if (priorDirection === recentDirection) return [];

	const severity: AnomalySeverity =
		Math.abs(recentAvgNet) > 10000 ? "high" : "medium";

	const confidence =
		Math.abs(priorAvgNet) > 0
			? round2(
					Math.min(
						0.65 +
							(Math.abs(recentAvgNet - priorAvgNet) / Math.abs(priorAvgNet)) *
								0.25,
						0.9,
					),
				)
			: 0.65;

	const reversed =
		priorDirection === "positive"
			? "alcista→bajista (positive→negative)"
			: "bajista→alcista (negative→positive)";

	anomalies.push({
		id: `cashflow-trend-reversal-${daily[mid].date}`,
		timestamp: new Date().toISOString(),
		entityType: "cashflow_trend",
		entityId: "trend",
		metric: "cashflow_trend_reversal",
		expectedValue: round2(priorAvgNet),
		actualValue: round2(recentAvgNet),
		deviation: round2(Math.abs(recentAvgNet - priorAvgNet)),
		severity,
		confidence,
		reasoning:
			`Cambio de tendencia: ${reversed}. ` +
			`Promedio neto previo (${daily[0].date}–${daily[mid - 1].date}): ` +
			`S/ ${round2(priorAvgNet).toLocaleString("es-PE")}. ` +
			`Promedio neto reciente (${daily[mid].date}–${daily[daily.length - 1].date}): ` +
			`S/ ${round2(recentAvgNet).toLocaleString("es-PE")}.`,
		detectionMethod: "cashflow_trend_reversal",
		context: {
			priorPeriod: {
				start: daily[0].date,
				end: daily[mid - 1].date,
				avgNet: round2(priorAvgNet),
			},
			recentPeriod: {
				start: daily[mid].date,
				end: daily[daily.length - 1].date,
				avgNet: round2(recentAvgNet),
			},
			change: round2(recentAvgNet - priorAvgNet),
		},
	});

	return anomalies;
}

function detectIncomeDrops(
	daily: DailyAggregate[],
	dropRatio: number,
): Anomaly[] {
	const anomalies: Anomaly[] = [];

	for (let i = 0; i < daily.length; i++) {
		const stats = computeRollingStats(daily, i, ROLLING_WINDOW_DAYS);
		if (stats.avgIncome === null || stats.avgIncome <= 0) continue;

		// Only flag if the day has income below threshold of rolling average
		if (daily[i].income >= stats.avgIncome * dropRatio) continue;

		const incomeBelowAvg = stats.avgIncome - daily[i].income;
		const dropPct = round2((incomeBelowAvg / stats.avgIncome) * 100);

		const severity: AnomalySeverity = dropPct > 50 ? "high" : "medium";
		const confidence = round2(
			Math.min(
				0.7 + (stats.stdIncome ? daily[i].income / (stats.avgIncome * 2) : 0),
				0.95,
			),
		);

		anomalies.push({
			id: `cashflow-income-drop-${daily[i].date}`,
			timestamp: new Date().toISOString(),
			entityType: "cashflow_day",
			entityId: daily[i].date,
			metric: "cashflow_income_drop",
			expectedValue: round2(stats.avgIncome),
			actualValue: round2(daily[i].income),
			deviation: round2(dropPct / 100),
			severity,
			confidence,
			reasoning:
				`Ingreso del día ${daily[i].date}: S/ ${round2(daily[i].income).toLocaleString("es-PE")}. ` +
				`Promedio ${ROLLING_WINDOW_DAYS} días: S/ ${round2(stats.avgIncome).toLocaleString("es-PE")}. ` +
				`Caída: ${dropPct.toFixed(1)}%.`,
			detectionMethod: "cashflow_income_drop_rolling",
			context: {
				date: daily[i].date,
				dailyIncome: round2(daily[i].income),
				rollingAvgIncome: round2(stats.avgIncome),
				rollingStdIncome: stats.stdIncome ? round2(stats.stdIncome) : null,
				dropPercent: dropPct,
				rollingWindowDays: ROLLING_WINDOW_DAYS,
				thresholdRatio: dropRatio,
			},
		});
	}

	return anomalies;
}

function detectExpenseSpikes(
	daily: DailyAggregate[],
	spikeRatio: number,
): Anomaly[] {
	const anomalies: Anomaly[] = [];

	for (let i = 0; i < daily.length; i++) {
		const stats = computeRollingStats(daily, i, ROLLING_WINDOW_DAYS);
		if (stats.avgExpense === null || stats.avgExpense <= 0) continue;

		// Only flag if expense exceeds threshold
		if (daily[i].expense <= stats.avgExpense * spikeRatio) continue;

		const expenseAboveAvg = daily[i].expense - stats.avgExpense;
		const spikePct = round2((expenseAboveAvg / stats.avgExpense) * 100);

		const severity: AnomalySeverity = spikePct > 100 ? "high" : "medium";
		const confidence = round2(
			Math.min(
				0.7 + (daily[i].expense - stats.avgExpense) / (stats.avgExpense * 3),
				0.95,
			),
		);

		anomalies.push({
			id: `cashflow-expense-spike-${daily[i].date}`,
			timestamp: new Date().toISOString(),
			entityType: "cashflow_day",
			entityId: daily[i].date,
			metric: "cashflow_expense_spike",
			expectedValue: round2(stats.avgExpense),
			actualValue: round2(daily[i].expense),
			deviation: round2(spikePct / 100),
			severity,
			confidence,
			reasoning:
				`Egreso del día ${daily[i].date}: S/ ${round2(daily[i].expense).toLocaleString("es-PE")}. ` +
				`Promedio ${ROLLING_WINDOW_DAYS} días: S/ ${round2(stats.avgExpense).toLocaleString("es-PE")}. ` +
				`Pico: ${spikePct.toFixed(1)}%.`,
			detectionMethod: "cashflow_expense_spike_rolling",
			context: {
				date: daily[i].date,
				dailyExpense: round2(daily[i].expense),
				rollingAvgExpense: round2(stats.avgExpense),
				rollingStdExpense: stats.stdExpense ? round2(stats.stdExpense) : null,
				spikePercent: spikePct,
				rollingWindowDays: ROLLING_WINDOW_DAYS,
				thresholdRatio: spikeRatio,
			},
		});
	}

	return anomalies;
}

// ─── Statistical helpers ──────────────────────────────────────────

function mean(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
	if (values.length < 2) return 0;
	const squaredDiffs = values.map((v) => (v - avg) ** 2);
	return Math.sqrt(
		squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1),
	);
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

function classifyZScoreSeverity(absZScore: number): AnomalySeverity {
	if (absZScore > 4) return "critical";
	if (absZScore > 3) return "high";
	if (absZScore > 2.5) return "medium";
	return "low";
}

function computeZScoreConfidence(absZScore: number): number {
	// Z-score 2 = 0.80, z-score 3 = 0.90, z-score 5+ = 0.99
	return round2(Math.min(0.7 + absZScore * 0.07, 0.99));
}
