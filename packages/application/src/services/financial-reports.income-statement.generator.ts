/**
 * Income Statement Report Generator — Estado de Resultados.
 */
import type {
	AccountBalance,
	IncomeStatementReport,
	ReportPeriod,
} from "./financial-reports.types";

function classifyIncomeExpense(code: string): {
	isRevenue: boolean;
	isExpense: boolean;
	isOperating: boolean;
} {
	const firstDigit = parseInt(code.charAt(0), 10);
	return {
		isRevenue: firstDigit === 7,
		isExpense: firstDigit === 8 || firstDigit === 9,
		isOperating: firstDigit === 7 || firstDigit === 8,
	};
}

export class IncomeStatementGenerator {
	static generate(
		orgInfo: { name: string; ruc: string },
		accounts: AccountBalance[],
		period: ReportPeriod,
	): IncomeStatementReport {
		const operations: AccountBalance[] = [];
		const nonOperations: AccountBalance[] = [];
		const costOfSales: AccountBalance[] = [];
		const operating: AccountBalance[] = [];
		const nonOperating: AccountBalance[] = [];

		for (const account of accounts) {
			const classification = classifyIncomeExpense(account.accountCode);
			if (classification.isRevenue) {
				if (classification.isOperating) operations.push(account);
				else nonOperations.push(account);
			} else if (classification.isExpense) {
				if (classification.isOperating) operating.push(account);
				else nonOperating.push(account);
			}
		}

		const totalRevenue =
			operations.reduce((sum, a) => sum + a.balance, 0) +
			nonOperations.reduce((sum, a) => sum + a.balance, 0);
		const totalExpenses =
			operating.reduce((sum, a) => sum + a.balance, 0) +
			nonOperating.reduce((sum, a) => sum + a.balance, 0);
		const grossProfit =
			totalRevenue - operating.reduce((sum, a) => sum + a.balance, 0);
		const operatingProfit =
			grossProfit - nonOperating.reduce((sum, a) => sum + a.balance, 0);
		const netProfit = operatingProfit;

		return {
			period,
			generatedAt: new Date(),
			organizationName: orgInfo.name,
			ruc: orgInfo.ruc,
			revenue: { operations, nonOperations, totalRevenue },
			expenses: { costOfSales, operating, nonOperating, totalExpenses },
			grossProfit,
			operatingProfit,
			netProfit,
			effectiveRate: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
		};
	}
}
