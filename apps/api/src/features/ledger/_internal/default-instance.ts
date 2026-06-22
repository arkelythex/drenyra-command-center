import type { GeneralLedgerEntry, TrialBalanceResult } from "../queries";
import { LedgerQueryService } from "../application/services/ledger-query.service";

const defaultService = new LedgerQueryService();

/**
 * defaultLedgerQueryService const.
 *
 * @example
 * ```ts
 * console.log(defaultLedgerQueryService);
 * ```
 */
export const defaultLedgerQueryService: Pick<
	LedgerQueryService,
	"getChartOfAccounts" | "getGeneralLedger" | "getTrialBalance"
> = {
	getChartOfAccounts(companyId: string): Promise<
		Array<{
			code: string;
			name: string;
			type: "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE";
			activity: number;
			totalDebit: string;
			totalCredit: string;
			balance: string;
		}>
	> {
		return defaultService.getChartOfAccounts(companyId);
	},

	getGeneralLedger(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<GeneralLedgerEntry[]> {
		return defaultService.getGeneralLedger(companyId, startDate, endDate);
	},

	getTrialBalance(
		companyId: string,
		asOfDate: Date,
	): Promise<TrialBalanceResult> {
		return defaultService.getTrialBalance(companyId, asOfDate);
	},
};
