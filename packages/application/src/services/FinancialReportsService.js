import { inject, SERVICE_TOKENS } from "../lib/di-container";

function classifyAccount(code) {
	const firstDigit = parseInt(code.charAt(0), 10);
	const firstTwoDigits = parseInt(code.substring(0, 2), 10);
	const isAsset = firstDigit >= 1 && firstDigit <= 3;
	const isLiability = firstDigit === 4;
	const isEquity = firstDigit === 5;
	const isExpense = firstDigit === 6 || firstDigit === 9;
	const isRevenue = firstDigit === 7;
	const isCost = firstTwoDigits === 69;
	const nature = isAsset || isExpense || isCost ? "DEBIT" : "CREDIT";
	return {
		class: firstDigit,
		isAsset,
		isLiability,
		isEquity,
		isRevenue,
		isExpense,
		isCost,
		nature,
	};
}
export class FinancialReportsService {
	balanceDataSource;
	organizationDataSource;
	ledgerDataSource;
	openingBalanceDataSource;
	constructor() {
		this.balanceDataSource = this.requireDependency(
			SERVICE_TOKENS.BALANCE_REPORT_DATA_SOURCE,
			"BALANCE_REPORT_DATA_SOURCE",
		);
		this.organizationDataSource = this.requireDependency(
			SERVICE_TOKENS.ORGANIZATION_REPORT_DATA_SOURCE,
			"ORGANIZATION_REPORT_DATA_SOURCE",
		);
		this.ledgerDataSource = inject(SERVICE_TOKENS.LEDGER_REPORT_DATA_SOURCE);
		this.openingBalanceDataSource = inject(
			SERVICE_TOKENS.OPENING_BALANCE_DATA_SOURCE,
		);
	}
	requireDependency(token, name) {
		const dependency = inject(token);
		if (!dependency) {
			throw new Error(`Missing dependency: ${name}`);
		}
		return dependency;
	}
	async generateTrialBalance(organizationId, period) {
		const [orgInfo, accountData] = await Promise.all([
			this.organizationDataSource.getOrganizationInfo(organizationId),
			this.balanceDataSource.getAccountBalances(
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
	async generateBalanceSheet(organizationId, period) {
		const [orgInfo, accountData] = await Promise.all([
			this.organizationDataSource.getOrganizationInfo(organizationId),
			this.balanceDataSource.getAccountBalances(
				organizationId,
				period.startDate,
				period.endDate,
			),
		]);
		const { accounts } = accountData;
		const currentAssets = [];
		const nonCurrentAssets = [];
		const currentLiabilities = [];
		const nonCurrentLiabilities = [];
		const equityItems = [];
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
	async generateIncomeStatement(organizationId, period) {
		const [orgInfo, accountData] = await Promise.all([
			this.organizationDataSource.getOrganizationInfo(organizationId),
			this.balanceDataSource.getAccountBalances(
				organizationId,
				period.startDate,
				period.endDate,
			),
		]);
		const { accounts } = accountData;
		const operatingRevenue = [];
		const otherRevenue = [];
		const costOfSales = [];
		const administrativeExpenses = [];
		const sellingExpenses = [];
		const financialIncome = [];
		const financialExpense = [];
		for (const account of accounts) {
			const code = account.accountCode;
			const twoDigits = code.substring(0, 2);
			if (twoDigits === "70") {
				operatingRevenue.push(account);
			} else if (twoDigits === "75" || twoDigits === "76") {
				otherRevenue.push(account);
			} else if (twoDigits === "77") {
				financialIncome.push(account);
			} else if (twoDigits === "69") {
				costOfSales.push(account);
			} else if (twoDigits === "94") {
				administrativeExpenses.push(account);
			} else if (twoDigits === "95") {
				sellingExpenses.push(account);
			} else if (twoDigits === "67") {
				financialExpense.push(account);
			}
		}
		const sumBalances = (items) =>
			items.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
		const totalRevenue =
			sumBalances(operatingRevenue) + sumBalances(otherRevenue);
		const totalCostOfSales = sumBalances(costOfSales);
		const grossProfit = totalRevenue - totalCostOfSales;
		const totalOperatingExpenses =
			sumBalances(administrativeExpenses) + sumBalances(sellingExpenses);
		const operatingIncome = grossProfit - totalOperatingExpenses;
		const totalOtherIncomeExpense =
			sumBalances(financialIncome) - sumBalances(financialExpense);
		const incomeBeforeTax = operatingIncome + totalOtherIncomeExpense;
		const incomeTax = incomeBeforeTax > 0 ? incomeBeforeTax * 0.295 : 0;
		const netIncome = incomeBeforeTax - incomeTax;
		return {
			period,
			generatedAt: new Date(),
			organizationName: orgInfo.name,
			ruc: orgInfo.ruc,
			revenue: {
				operatingRevenue,
				otherRevenue,
				totalRevenue: Math.round(totalRevenue * 100) / 100,
			},
			costOfSales: {
				items: costOfSales,
				total: Math.round(totalCostOfSales * 100) / 100,
			},
			grossProfit: Math.round(grossProfit * 100) / 100,
			operatingExpenses: {
				administrative: administrativeExpenses,
				selling: sellingExpenses,
				total: Math.round(totalOperatingExpenses * 100) / 100,
			},
			operatingIncome: Math.round(operatingIncome * 100) / 100,
			otherIncomeExpense: {
				financialIncome,
				financialExpense,
				total: Math.round(totalOtherIncomeExpense * 100) / 100,
			},
			incomeBeforeTax: Math.round(incomeBeforeTax * 100) / 100,
			incomeTax: Math.round(incomeTax * 100) / 100,
			netIncome: Math.round(netIncome * 100) / 100,
		};
	}
	async generateGeneralLedger(organizationId, period, accountCodes) {
		const orgInfo =
			await this.organizationDataSource.getOrganizationInfo(organizationId);
		const accountData = await this.balanceDataSource.getAccountBalances(
			organizationId,
			period.startDate,
			period.endDate,
		);
		const { accounts: allAccounts } = accountData;
		const accountsToProcess = accountCodes
			? (() => {
					const codeSet = new Set(accountCodes);
					return allAccounts.filter((a) => codeSet.has(a.accountCode));
				})()
			: allAccounts;
		const ledgerAccounts = [];
		for (const account of accountsToProcess) {
			const openingBalance =
				(await this.openingBalanceDataSource?.getOpeningBalance(
					organizationId,
					account.accountCode,
					period.startDate,
				)) ?? 0;
			const entries =
				(await this.ledgerDataSource?.getLedgerEntries(
					organizationId,
					account.accountCode,
					period.startDate,
					period.endDate,
				)) ?? [];
			let runningBalance = openingBalance;
			const entriesWithBalance = entries.map((entry) => {
				runningBalance += entry.debit - entry.credit;
				return {
					...entry,
					runningBalance: Math.round(runningBalance * 100) / 100,
				};
			});
			ledgerAccounts.push({
				accountCode: account.accountCode,
				accountName: account.accountName,
				period,
				openingBalance: Math.round(openingBalance * 100) / 100,
				entries: entriesWithBalance,
				closingBalance: Math.round(runningBalance * 100) / 100,
			});
		}
		return {
			period,
			generatedAt: new Date(),
			organizationName: orgInfo.name,
			ruc: orgInfo.ruc,
			accounts: ledgerAccounts.sort((a, b) =>
				a.accountCode.localeCompare(b.accountCode),
			),
		};
	}
}
export function createFinancialReportsService() {
	return new FinancialReportsService();
}
//# sourceMappingURL=FinancialReportsService.js.map
