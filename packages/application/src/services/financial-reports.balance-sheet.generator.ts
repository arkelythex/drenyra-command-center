/**
 * Balance Sheet Report Generator — Balance General.
 */
import type {
	AccountBalance,
	BalanceSheetReport,
	ReportPeriod,
} from "./financial-reports.types";

function classifyAccount(code: string): {
	isAsset: boolean;
	isLiability: boolean;
	isEquity: boolean;
	isCurrent: boolean;
} {
	const firstDigit = parseInt(code.charAt(0), 10);
	const secondDigit = parseInt(code.charAt(1), 10);
	return {
		isAsset: firstDigit === 1,
		isLiability: firstDigit === 2 || firstDigit === 3,
		isEquity: firstDigit === 4,
		isCurrent: secondDigit <= 3,
	};
}

export class BalanceSheetGenerator {
	static generate(
		orgInfo: { name: string; ruc: string },
		accounts: AccountBalance[],
		period: ReportPeriod,
	): BalanceSheetReport {
		const currentAssets: AccountBalance[] = [];
		const nonCurrentAssets: AccountBalance[] = [];
		const currentLiabilities: AccountBalance[] = [];
		const nonCurrentLiabilities: AccountBalance[] = [];
		const equityItems: AccountBalance[] = [];

		for (const account of accounts) {
			const classification = classifyAccount(account.accountCode);
			if (classification.isAsset) {
				if (classification.isCurrent) currentAssets.push(account);
				else nonCurrentAssets.push(account);
			} else if (classification.isLiability) {
				if (classification.isCurrent) currentLiabilities.push(account);
				else nonCurrentLiabilities.push(account);
			} else if (classification.isEquity) {
				equityItems.push(account);
			}
		}

		const totalAssets =
			currentAssets.reduce((sum, a) => sum + a.balance, 0) +
			nonCurrentAssets.reduce((sum, a) => sum + a.balance, 0);
		const totalLiabilities =
			currentLiabilities.reduce((sum, a) => sum + a.balance, 0) +
			nonCurrentLiabilities.reduce((sum, a) => sum + a.balance, 0);
		const totalEquity = equityItems.reduce((sum, a) => sum + a.balance, 0);

		return {
			period,
			generatedAt: new Date(),
			organizationName: orgInfo.name,
			ruc: orgInfo.ruc,
			assets: {
				current: currentAssets,
				nonCurrent: nonCurrentAssets,
				totalAssets,
			},
			liabilities: {
				current: currentLiabilities,
				nonCurrent: nonCurrentLiabilities,
				totalLiabilities,
			},
			equity: { items: equityItems, totalEquity },
			totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
			balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
		};
	}
}
