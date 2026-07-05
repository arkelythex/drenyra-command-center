/**
 * Get Actual Cashflow Query
 *
 * Returns actual historical cash inflows and outflows based on bank transactions.
 *
 * @module cashflow/application/queries
 */

import type { Currency } from "@drenyra/domain";
import {
	type CashflowDataResult,
	type GetCashflowDataInput,
	getCashflowData,
} from "../../../banking/application/queries/get-cashflow-data.query";

/**
 * Input contract for retrieving actual cashflow over a historical period.
 *
 * @example
 * ```ts
 * const input: GetActualCashflowInput = {
 *   companyId: 'cmp_1',
 *   startDate: new Date(),
 *   endDate: new Date(),
 * };
 * ```
 */
export interface GetActualCashflowInput {
	companyId: string;
	startDate: Date;
	endDate: Date;
	currency?: Currency; // Default: 'PEN'
}

/**
 * Aggregated historical cashflow totals for the selected period.
 *
 * @example
 * ```ts
 * const result: ActualCashflowResult = {
 *   companyId: 'cmp_1',
 *   period: { startDate: new Date(), endDate: new Date() },
 *   currency: 'PEN',
 *   actualInflows: 0,
 *   actualOutflows: 0,
 *   netCashflow: 0,
 *   transactionCount: { inflows: 0, outflows: 0 },
 * };
 * ```
 */
export interface ActualCashflowResult {
	companyId: string;
	period: {
		startDate: Date;
		endDate: Date;
	};
	currency: Currency;
	actualInflows: number;
	actualOutflows: number;
	netCashflow: number;
	transactionCount: {
		inflows: number;
		outflows: number;
	};
}

/**
 * Get Actual Cashflow
 *
 * Retrieves actual cashflow from bank transactions:
 * - Inflows: CREDIT transactions within period
 * - Outflows: DEBIT transactions within period
 *
 * @example
 * ```ts
 * const actual = await getActualCashflow({ companyId: 'cmp_1', startDate: new Date(), endDate: new Date() });
 * ```
 */
export async function getActualCashflow(
	input: GetActualCashflowInput,
	fetchCashflowData: (
		input: GetCashflowDataInput,
	) => Promise<CashflowDataResult> = (i) => getCashflowData(i),
): Promise<ActualCashflowResult> {
	const currency = input.currency || "PEN";
	const cashflow = await fetchCashflowData({
		companyId: input.companyId,
		startDate: input.startDate,
		endDate: input.endDate,
		currency,
	});

	return {
		companyId: input.companyId,
		period: {
			startDate: input.startDate,
			endDate: input.endDate,
		},
		currency,
		actualInflows: cashflow.totalInflows,
		actualOutflows: cashflow.totalOutflows,
		netCashflow: cashflow.netCashflow,
		transactionCount: {
			inflows: cashflow.transactionCount.credits,
			outflows: cashflow.transactionCount.debits,
		},
	};
}
