import type {
	BalanceReportDataSource,
	OrganizationReportDataSource,
	ReportPeriod,
	TrialBalanceReport,
} from "./types";

export async function generateTrialBalanceReport(
	balanceDataSource: BalanceReportDataSource,
	organizationDataSource: OrganizationReportDataSource,
	organizationId: number,
	period: ReportPeriod,
): Promise<TrialBalanceReport> {
	const [orgInfo, accountData] = await Promise.all([
		organizationDataSource.getOrganizationInfo(organizationId),
		balanceDataSource.getAccountBalances(
			organizationId,
			period.startDate,
			period.endDate,
		),
	]);

	const { accounts, totals } = accountData;

	return {
		period,
		generatedAt: new Date(),
		organizationName: orgInfo.name,
		ruc: orgInfo.ruc,
		accounts: accounts.sort((a, b) =>
			a.accountCode.localeCompare(b.accountCode),
		),
		totals: {
			totalDebit: Math.round(totals.totalDebit * 100) / 100,
			totalCredit: Math.round(totals.totalCredit * 100) / 100,
			difference:
				Math.round((totals.totalDebit - totals.totalCredit) * 100) / 100,
		},
	};
}
