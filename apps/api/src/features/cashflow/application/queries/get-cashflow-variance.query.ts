/**
 * Get Cashflow Variance Query
 *
 * Compares projected vs actual cashflow for variance analysis.
 *
 * @module cashflow/application/queries
 */

import type { Currency } from "@arkelythex/domain";
import { getActualCashflow } from "./get-actual-cashflow.query";
import { getCashflowProjection } from "./get-cashflow-projection.query";

/**
 * Input contract for variance analysis between projected and actual cashflow.
 *
 * @example
 * ```ts
 * const input: GetCashflowVarianceInput = {
 *   companyId: 'cmp_1',
 *   startDate: new Date(),
 *   endDate: new Date(),
 * };
 * ```
 */
export interface GetCashflowVarianceInput {
	companyId: string;
	startDate: Date;
	endDate: Date;
	currency?: Currency; // Default: 'PEN'
}

/**
 * Variance analysis payload comparing expected and realized cashflow.
 *
 * @example
 * ```ts
 * const result: VarianceResult = {
 *   companyId: 'cmp_1',
 *   period: { startDate: new Date(), endDate: new Date() },
 *   currency: 'PEN',
 *   projected: { inflows: 0, outflows: 0, netCashflow: 0 },
 *   actual: { inflows: 0, outflows: 0, netCashflow: 0 },
 *   variance: {
 *     inflows: 0,
 *     outflows: 0,
 *     netCashflow: 0,
 *     inflowsPercentage: 0,
 *     outflowsPercentage: 0,
 *     netPercentage: 0,
 *   },
 *   alerts: [],
 * };
 * ```
 */
export interface VarianceResult {
	companyId: string;
	period: {
		startDate: Date;
		endDate: Date;
	};
	currency: Currency;
	projected: {
		inflows: number;
		outflows: number;
		netCashflow: number;
	};
	actual: {
		inflows: number;
		outflows: number;
		netCashflow: number;
	};
	variance: {
		inflows: number;
		outflows: number;
		netCashflow: number;
		inflowsPercentage: number;
		outflowsPercentage: number;
		netPercentage: number;
	};
	alerts: string[];
}

/**
 * Get Cashflow Variance
 *
 * **Analysis:**
 * - Compares projected cashflow (based on dueDate) vs actual (based on bank movement)
 * - Calculates absolute variance and percentage variance
 * - Generates alerts for significant variances (>20%)
 *
 * **Use Cases:**
 * - Validate cashflow projections accuracy
 * - Identify collection/payment delays
 * - Improve future forecasting models
 *
 * @example
 * ```ts
 * const variance = await getCashflowVariance({ companyId: 'cmp_1', startDate: new Date(), endDate: new Date() });
 * ```
 */
export async function getCashflowVariance(
	input: GetCashflowVarianceInput,
): Promise<VarianceResult> {
	const currency = input.currency || "PEN";

	// Calculate days between startDate and endDate
	const days = Math.ceil(
		(input.endDate.getTime() - input.startDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);

	// Get projected cashflow (what we expected)
	const projection = await getCashflowProjection({
		companyId: input.companyId,
		days,
		currency,
	});

	// Get actual cashflow (what really happened)
	const actual = await getActualCashflow({
		companyId: input.companyId,
		startDate: input.startDate,
		endDate: input.endDate,
		currency,
	});

	// Calculate variance
	const projectedInflows = projection.totalInflows.getAmount();
	const projectedOutflows = projection.totalOutflows.getAmount();
	const projectedNet = projection.netCashflow.getAmount();

	const actualInflows = actual.actualInflows;
	const actualOutflows = actual.actualOutflows;
	const actualNet = actual.netCashflow;

	const varianceInflows = actualInflows - projectedInflows;
	const varianceOutflows = actualOutflows - projectedOutflows;
	const varianceNet = actualNet - projectedNet;

	// Calculate percentage variance
	const inflowsPercentage =
		projectedInflows !== 0 ? (varianceInflows / projectedInflows) * 100 : 0;

	const outflowsPercentage =
		projectedOutflows !== 0 ? (varianceOutflows / projectedOutflows) * 100 : 0;

	const netPercentage =
		projectedNet !== 0 ? (varianceNet / projectedNet) * 100 : 0;

	// Generate alerts
	const alerts: string[] = [];

	if (Math.abs(inflowsPercentage) > 20) {
		alerts.push(
			`⚠️ Inflows variance: ${inflowsPercentage.toFixed(1)}% (${varianceInflows > 0 ? "higher" : "lower"} than projected)`,
		);
	}

	if (Math.abs(outflowsPercentage) > 20) {
		alerts.push(
			`⚠️ Outflows variance: ${outflowsPercentage.toFixed(1)}% (${varianceOutflows > 0 ? "higher" : "lower"} than projected)`,
		);
	}

	if (Math.abs(netPercentage) > 20) {
		alerts.push(
			`⚠️ Net cashflow variance: ${netPercentage.toFixed(1)}% (${varianceNet > 0 ? "better" : "worse"} than projected)`,
		);
	}

	if (projectedNet > 0 && actualNet < 0) {
		alerts.push("🚨 CRITICAL: Projected surplus became actual deficit");
	}

	if (projection.isDeficit && actualNet > 0) {
		alerts.push("✅ POSITIVE: Projected deficit was avoided");
	}

	return {
		companyId: input.companyId,
		period: {
			startDate: input.startDate,
			endDate: input.endDate,
		},
		currency,
		projected: {
			inflows: projectedInflows,
			outflows: projectedOutflows,
			netCashflow: projectedNet,
		},
		actual: {
			inflows: actualInflows,
			outflows: actualOutflows,
			netCashflow: actualNet,
		},
		variance: {
			inflows: Math.round(varianceInflows * 100) / 100,
			outflows: Math.round(varianceOutflows * 100) / 100,
			netCashflow: Math.round(varianceNet * 100) / 100,
			inflowsPercentage: Math.round(inflowsPercentage * 100) / 100,
			outflowsPercentage: Math.round(outflowsPercentage * 100) / 100,
			netPercentage: Math.round(netPercentage * 100) / 100,
		},
		alerts,
	};
}
