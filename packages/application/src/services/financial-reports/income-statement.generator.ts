import type {
	AccountBalance,
	BalanceReportDataSource,
	IncomeStatementReport,
	OrganizationReportDataSource,
	ReportPeriod,
} from "./types";

export async function generateIncomeStatementReport(
	balanceDataSource: BalanceReportDataSource,
	organizationDataSource: OrganizationReportDataSource,
	organizationId: number,
	period: ReportPeriod,
): Promise<IncomeStatementReport> {
	const [orgInfo, accountData] = await Promise.all([
		organizationDataSource.getOrganizationInfo(organizationId),
		balanceDataSource.getAccountBalances(
			organizationId,
			period.startDate,
			period.endDate,
		),
	]);

	const { accounts } = accountData;

	const operatingRevenue: AccountBalance[] = [];
	const otherRevenue: AccountBalance[] = [];
	const costOfSales: AccountBalance[] = [];
	const administrativeExpenses: AccountBalance[] = [];
	const sellingExpenses: AccountBalance[] = [];
	const financialIncome: AccountBalance[] = [];
	const financialExpense: AccountBalance[] = [];

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

	const sumBalances = (items: AccountBalance[]) =>
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
