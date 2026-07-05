/**
 * Get Cashflow Forecast Query
 *
 * Returns cashflow forecast based on historical bank transaction trends.
 *
 * @module cashflow/application/queries
 */

import type { Currency } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte } from "@drenyra/persistence/query";
import { bankTransactions } from "@drenyra/persistence/schema";

/**
 * Input contract for generating a forward-looking cashflow forecast.
 *
 * @example
 * ```ts
 * const input: GetCashflowForecastInput = { companyId: 'cmp_1', months: 3 };
 * ```
 */
export interface GetCashflowForecastInput {
	companyId: string;
	months?: number; // Default: 3
	currency?: Currency; // Default: 'PEN'
}

/**
 * Forecast for a single future month.
 *
 * @example
 * ```ts
 * const month: MonthlyForecast = {
 *   month: '2026-03',
 *   expectedInflows: 1000,
 *   expectedOutflows: 500,
 *   netCashflow: 500,
 *   confidence: 0.9,
 * };
 * ```
 */
export interface MonthlyForecast {
	month: string; // YYYY-MM format
	expectedInflows: number;
	expectedOutflows: number;
	netCashflow: number;
	confidence: number; // 0.0 - 1.0 (based on historical consistency)
}

/**
 * Full forecast response returned by the historical-average query.
 *
 * @example
 * ```ts
 * const result: CashflowForecastResult = {
 *   companyId: 'cmp_1',
 *   months: 3,
 *   currency: 'PEN',
 *   forecast: [],
 *   method: 'historical_average',
 *   basedOnMonths: 6,
 * };
 * ```
 */
export interface CashflowForecastResult {
	companyId: string;
	months: number;
	currency: Currency;
	forecast: MonthlyForecast[];
	method: string;
	basedOnMonths: number; // Historical data used
}

/**
 * Group transactions by month (YYYY-MM)
 */
function groupByMonth(
	inflows: Array<{ date: Date; amount: number; type: "inflow" }>,
	outflows: Array<{ date: Date; amount: number; type: "outflow" }>,
): Record<string, { inflows: number; outflows: number }> {
	const grouped: Record<string, { inflows: number; outflows: number }> = {};

	for (const item of inflows) {
		const key = formatMonth(item.date);
		if (!grouped[key]) grouped[key] = { inflows: 0, outflows: 0 };
		grouped[key].inflows += item.amount;
	}

	for (const item of outflows) {
		const key = formatMonth(item.date);
		if (!grouped[key]) grouped[key] = { inflows: 0, outflows: 0 };
		grouped[key].outflows += item.amount;
	}

	return grouped;
}

/**
 * Format date as YYYY-MM
 */
function formatMonth(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function toDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value);
}

/**
 * Calculate average
 */
function calculateAverage(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[], mean: number): number {
	if (values.length === 0) return 0;
	const variance =
		values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
	return Math.sqrt(variance);
}

/**
 * Get Cashflow Forecast
 *
 * Simple forecast based on historical average.
 *
 * **Method:**
 * - Analyzes last 6 months of bank transactions
 * - Calculates monthly average for inflows/outflows
 * - Projects forward N months
 * - Confidence based on standard deviation (low variance = high confidence)
 *
 * **Future:** AI-powered forecasting with seasonal adjustments (Agent Swarm Phase 3)
 *
 * @example
 * ```ts
 * const forecast = await getCashflowForecast({ companyId: 'cmp_1', months: 3 });
 * ```
 */
export async function getCashflowForecast(
	input: GetCashflowForecastInput,
): Promise<CashflowForecastResult> {
	const months = input.months || 3;
	const currency = input.currency || "PEN";
	const historicalMonths = 6; // Analyze last 6 months

	// Calculate historical period
	const endDate = new Date();
	const startDate = new Date();
	startDate.setMonth(startDate.getMonth() - historicalMonths);

	const historicalTransactions = await db
		.select({
			transactionDate: bankTransactions.transactionDate,
			type: bankTransactions.type,
			amount: bankTransactions.amount,
		})
		.from(bankTransactions)
		.where(
			and(
				eq(bankTransactions.companyId, input.companyId),
				gte(bankTransactions.transactionDate, formatDate(startDate)),
				lte(bankTransactions.transactionDate, formatDate(endDate)),
			),
		);

	// Group by month
	const monthlyData = groupByMonth(
		historicalTransactions
			.filter((tx) => tx.type === "CREDIT")
			.map((tx) => ({
				date: toDate(tx.transactionDate),
				amount: Number(tx.amount),
				type: "inflow" as const,
			})),
		historicalTransactions
			.filter((tx) => tx.type === "DEBIT")
			.map((tx) => ({
				date: toDate(tx.transactionDate),
				amount: Number(tx.amount),
				type: "outflow" as const,
			})),
	);

	// Calculate average and standard deviation
	const avgInflows = calculateAverage(
		Object.values(monthlyData).map((m) => m.inflows),
	);
	const avgOutflows = calculateAverage(
		Object.values(monthlyData).map((m) => m.outflows),
	);

	const stdDevInflows = calculateStdDev(
		Object.values(monthlyData).map((m) => m.inflows),
		avgInflows,
	);

	// Confidence: high consistency = high confidence
	// CV (Coefficient of Variation) < 0.3 = high confidence (>0.85)
	const cv = stdDevInflows / (avgInflows || 1);
	const confidence = Math.max(0.5, Math.min(0.95, 1 - cv));

	// Generate forecast
	const forecast: MonthlyForecast[] = [];
	const today = new Date();

	for (let i = 1; i <= months; i++) {
		const forecastDate = new Date(today);
		forecastDate.setMonth(forecastDate.getMonth() + i);
		const monthKey = formatMonth(forecastDate);

		forecast.push({
			month: monthKey,
			expectedInflows: Math.round(avgInflows * 100) / 100,
			expectedOutflows: Math.round(avgOutflows * 100) / 100,
			netCashflow: Math.round((avgInflows - avgOutflows) * 100) / 100,
			confidence: Math.round(confidence * 100) / 100,
		});
	}

	return {
		companyId: input.companyId,
		months,
		currency,
		forecast,
		method: "historical_average",
		basedOnMonths: Object.keys(monthlyData).length,
	};
}
