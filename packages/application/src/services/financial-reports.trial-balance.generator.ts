/**
 * Trial Balance Report Generator — Balance de Comprobación.
 */
import type {
	AccountBalance,
	ReportPeriod,
	TrialBalanceReport,
} from "./financial-reports.types";

export class TrialBalanceGenerator {
	static generate(
		orgInfo: { name: string; ruc: string },
		accounts: AccountBalance[],
		period: ReportPeriod,
	): TrialBalanceReport {
		const sorted = [...accounts].sort((a, b) =>
			a.accountCode.localeCompare(b.accountCode),
		);
		const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
		const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);

		return {
			period,
			generatedAt: new Date(),
			organizationName: orgInfo.name,
			ruc: orgInfo.ruc,
			accounts: sorted,
			totals: {
				totalDebit: Math.round(totalDebit * 100) / 100,
				totalCredit: Math.round(totalCredit * 100) / 100,
				difference: Math.round((totalDebit - totalCredit) * 100) / 100,
			},
		};
	}
}
