export const DEFAULT_ZSCORE_THRESHOLD = 2.0;
export const ROLLING_WINDOW_DAYS = 7;
export const INCOME_DROP_RATIO = 0.7;
export const EXPENSE_SPIKE_RATIO = 1.5;
export const MIN_DATA_POINTS = 7;
export const TREND_WINDOW_DAYS = 14;
export function createCashflowPredictorStrategy(options = {}) {
    const { zscoreThreshold = DEFAULT_ZSCORE_THRESHOLD, rollingWindowDays = ROLLING_WINDOW_DAYS, incomeDropRatio = INCOME_DROP_RATIO, expenseSpikeRatio = EXPENSE_SPIKE_RATIO, detectTrendReversal = true, } = options;
    return {
        id: "cashflow-predictor",
        name: "Cashflow Anomaly Detection",
        description: "Detects cashflow anomalies: statistical outliers (z-score), trend reversals," +
            " income drops, and expense spikes. Based on data-engine CashflowAnalyzer port.",
        minSeverity: "low",
        execute(data, _context) {
            if (!Array.isArray(data))
                return [];
            if (data.length < MIN_DATA_POINTS)
                return [];
            const transactions = data;
            const daily = aggregateDaily(transactions, rollingWindowDays);
            if (daily.length < MIN_DATA_POINTS)
                return [];
            const anomalies = [];
            const zScoreAnomalies = detectZScoreOutliers(daily, zscoreThreshold);
            anomalies.push(...zScoreAnomalies);
            if (detectTrendReversal && daily.length >= TREND_WINDOW_DAYS) {
                const trendAnomalies = detectTrendReversalAnomalies(daily);
                anomalies.push(...trendAnomalies);
            }
            const incomeDrops = detectIncomeDrops(daily, incomeDropRatio);
            anomalies.push(...incomeDrops);
            const expenseSpikes = detectExpenseSpikes(daily, expenseSpikeRatio);
            anomalies.push(...expenseSpikes);
            return anomalies;
        },
    };
}
function aggregateDaily(transactions, windowDays) {
    const dateMap = new Map();
    for (const tx of transactions) {
        const existing = dateMap.get(tx.date) ?? { income: 0, expense: 0 };
        if (tx.type === "INCOME") {
            existing.income += tx.amount;
        }
        else {
            existing.expense += tx.amount;
        }
        dateMap.set(tx.date, existing);
    }
    const sorted = Array.from(dateMap.entries())
        .map(([date, { income, expense }]) => ({
        date,
        dateObj: new Date(date + "T00:00:00"),
        income,
        expense,
        net: income - expense,
    }))
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return sorted;
}
function computeRollingStats(daily, index, windowDays) {
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
function detectZScoreOutliers(daily, threshold) {
    const netValues = daily.map((d) => d.net);
    const avgNet = mean(netValues);
    const stdNet = stdDev(netValues, avgNet);
    if (stdNet === 0)
        return [];
    const anomalies = [];
    for (const day of daily) {
        const zScore = stdNet > 0 ? (day.net - avgNet) / stdNet : 0;
        if (Math.abs(zScore) <= threshold)
            continue;
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
            reasoning: `Flujo neto del día ${day.date}: S/ ${round2(day.net).toLocaleString("es-PE")}. ` +
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
function detectTrendReversalAnomalies(daily) {
    const anomalies = [];
    const mid = Math.floor(daily.length / 2);
    const priorHalf = daily.slice(0, mid);
    const recentHalf = daily.slice(mid);
    const priorAvgNet = mean(priorHalf.map((d) => d.net));
    const recentAvgNet = mean(recentHalf.map((d) => d.net));
    const priorDirection = priorAvgNet >= 0 ? "positive" : "negative";
    const recentDirection = recentAvgNet >= 0 ? "positive" : "negative";
    if (priorDirection === recentDirection)
        return [];
    const severity = Math.abs(recentAvgNet) > 10000 ? "high" : "medium";
    const confidence = Math.abs(priorAvgNet) > 0
        ? round2(Math.min(0.65 +
            (Math.abs(recentAvgNet - priorAvgNet) / Math.abs(priorAvgNet)) *
                0.25, 0.9))
        : 0.65;
    const reversed = priorDirection === "positive"
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
        reasoning: `Cambio de tendencia: ${reversed}. ` +
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
function detectIncomeDrops(daily, dropRatio) {
    const anomalies = [];
    for (let i = 0; i < daily.length; i++) {
        const stats = computeRollingStats(daily, i, ROLLING_WINDOW_DAYS);
        if (stats.avgIncome === null || stats.avgIncome <= 0)
            continue;
        if (daily[i].income >= stats.avgIncome * dropRatio)
            continue;
        const incomeBelowAvg = stats.avgIncome - daily[i].income;
        const dropPct = round2((incomeBelowAvg / stats.avgIncome) * 100);
        const severity = dropPct > 50 ? "high" : "medium";
        const confidence = round2(Math.min(0.7 + (stats.stdIncome ? daily[i].income / (stats.avgIncome * 2) : 0), 0.95));
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
            reasoning: `Ingreso del día ${daily[i].date}: S/ ${round2(daily[i].income).toLocaleString("es-PE")}. ` +
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
function detectExpenseSpikes(daily, spikeRatio) {
    const anomalies = [];
    for (let i = 0; i < daily.length; i++) {
        const stats = computeRollingStats(daily, i, ROLLING_WINDOW_DAYS);
        if (stats.avgExpense === null || stats.avgExpense <= 0)
            continue;
        if (daily[i].expense <= stats.avgExpense * spikeRatio)
            continue;
        const expenseAboveAvg = daily[i].expense - stats.avgExpense;
        const spikePct = round2((expenseAboveAvg / stats.avgExpense) * 100);
        const severity = spikePct > 100 ? "high" : "medium";
        const confidence = round2(Math.min(0.7 + (daily[i].expense - stats.avgExpense) / (stats.avgExpense * 3), 0.95));
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
            reasoning: `Egreso del día ${daily[i].date}: S/ ${round2(daily[i].expense).toLocaleString("es-PE")}. ` +
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
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}
function stdDev(values, avg) {
    if (values.length < 2)
        return 0;
    const squaredDiffs = values.map((v) => (v - avg) ** 2);
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}
function round2(value) {
    return Math.round(value * 100) / 100;
}
function classifyZScoreSeverity(absZScore) {
    if (absZScore > 4)
        return "critical";
    if (absZScore > 3)
        return "high";
    if (absZScore > 2.5)
        return "medium";
    return "low";
}
function computeZScoreConfidence(absZScore) {
    return round2(Math.min(0.7 + absZScore * 0.07, 0.99));
}
//# sourceMappingURL=cashflow-predictor.strategy.js.map