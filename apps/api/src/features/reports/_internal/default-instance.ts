import { getBalanceSheet } from "../application/queries/get-balance-sheet";
import { getCashFlow } from "../application/queries/get-cash-flow";
import { getProfitLoss } from "../application/queries/get-profit-loss";
import { getSalesByCustomer } from "../application/queries/get-sales-by-customer";
import type {
	BalanceSheetReport,
	CashFlowReport,
	ProfitLossReport,
	SalesByCustomerRow,
} from "../reports.schemas";

/**
 * ReportsService const — adapter for external consumers (e.g. ledger-mvp).
 * Delegates to function-based CQRS queries.
 *
 * @example
 * ```ts
 * console.log(ReportsService);
 * ```
 */
export const ReportsService = {
	getProfitLoss(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<ProfitLossReport> {
		return getProfitLoss(companyId, startDate, endDate);
	},

	getBalanceSheet(
		companyId: string,
		asOfDate: Date,
	): Promise<BalanceSheetReport> {
		return getBalanceSheet(companyId, asOfDate);
	},

	getCashFlow(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<CashFlowReport> {
		return getCashFlow(companyId, startDate, endDate);
	},

	getSalesByCustomer(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<SalesByCustomerRow[]> {
		return getSalesByCustomer(companyId, startDate, endDate);
	},
};
