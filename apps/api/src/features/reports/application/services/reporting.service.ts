import { db as globalDb } from "@drenyra/persistence/client";
import {
	GetBalanceSheetQuery,
	GetCashFlowQuery,
	GetProfitLossQuery,
	GetSalesByCustomerQuery,
} from "../../queries";
import type {
	BalanceSheetReport,
	CashFlowReport,
	ProfitLossReport,
	SalesByCustomerRow,
} from "../../reports.schemas";

/**
 * ReportingService class.
 *
 * @example
 * ```ts
 * const value = new ReportingService();
 * console.log(value);
 * ```
 */
export class ReportingService {
	private readonly getProfitLossQuery: GetProfitLossQuery;
	private readonly getBalanceSheetQuery: GetBalanceSheetQuery;
	private readonly getCashFlowQuery: GetCashFlowQuery;
	private readonly getSalesByCustomerQuery: GetSalesByCustomerQuery;

	constructor(db = globalDb) {
		this.getProfitLossQuery = new GetProfitLossQuery(db);
		this.getBalanceSheetQuery = new GetBalanceSheetQuery(db);
		this.getCashFlowQuery = new GetCashFlowQuery(db);
		this.getSalesByCustomerQuery = new GetSalesByCustomerQuery(db);
	}

	async getProfitLoss(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<ProfitLossReport> {
		return this.getProfitLossQuery.execute(companyId, startDate, endDate);
	}

	async getBalanceSheet(
		companyId: string,
		asOfDate: Date,
	): Promise<BalanceSheetReport> {
		return this.getBalanceSheetQuery.execute(companyId, asOfDate);
	}

	async getCashFlow(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<CashFlowReport> {
		return this.getCashFlowQuery.execute(companyId, startDate, endDate);
	}

	async getSalesByCustomer(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<SalesByCustomerRow[]> {
		return this.getSalesByCustomerQuery.execute(companyId, startDate, endDate);
	}
}
