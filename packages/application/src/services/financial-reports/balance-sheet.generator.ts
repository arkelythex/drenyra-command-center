import {
	type BalanceReportDataSource,
	type OrganizationReportDataSource,
	type ReportPeriod,
	type BalanceSheetReport,
	type AccountBalance,
	classifyAccount,
} from "./types";

export async function generateBalanceSheetReport(
	balanceDataSource: BalanceReportDataSource,
	organizationDataSource: OrganizationReportDataSource,
	organizationId: number,
	period: ReportPeriod,
): Promise<BalanceSheetReport> {
	const [orgInfo, accountData] = await Promise.all([
		organizationDataSource.getOrganizationInfo(organizationId),
		balanceDataSource.getAccountBalances(
			organizationId,
			period.startDate,
			period.endDate,
		),
	]);

	const { accounts } = accountData;

	const currentAssets: AccountBalance[] = [];
	const nonCurrentAssets: AccountBalance[] = [];
	const currentLiabilities: AccountBalance[] = [];
	const nonCurrentLiabilities: AccountBalance[] = [];
	const equityItems: AccountBalance[] = [];

	for (const account of accounts) {
		const classification = classifyAccount(account.accountCode);
		const firstDigit = parseInt(account.accountCode.charAt(0), 10);

		if (classification.isAsset) {
			if (firstDigit === 1) {
				currentAssets.push(account);
			} else {
				nonCurrentAssets.push(account);
			}
		} else if (classification.isLiability) {
			currentLiabilities.push(account);
		} else if (classification.isEquity) {
			equityItems.push(account);
		}
	}

	const totalAssets = [...currentAssets, ...nonCurrentAssets].reduce(
		(sum, acc) => sum + acc.balance,
		0,
	);

	const totalLiabilities = [
		...currentLiabilities,
		...nonCurrentLiabilities,
	].reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

	const totalEquity = equityItems.reduce(
		(sum, acc) => sum + Math.abs(acc.balance),
		0,
	);

	const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

	return {
		period,
		generatedAt: new Date(),
		organizationName: orgInfo.name,
		ruc: orgInfo.ruc,
		assets: {
			current: currentAssets,
			nonCurrent: nonCurrentAssets,
			totalAssets: Math.round(totalAssets * 100) / 100,
		},
		liabilities: {
			current: currentLiabilities,
			nonCurrent: nonCurrentLiabilities,
			totalLiabilities: Math.round(totalLiabilities * 100) / 100,
		},
		equity: {
			items: equityItems,
			totalEquity: Math.round(totalEquity * 100) / 100,
		},
		totalLiabilitiesAndEquity:
			Math.round(totalLiabilitiesAndEquity * 100) / 100,
		balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
	};
}
