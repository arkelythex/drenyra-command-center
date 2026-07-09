import { LedgerEntry } from "./financial-reports/types";
/**
 * Financial Reports Service
 *
 * Generates financial reports required for Peruvian accounting:
 * - Balance General (Balance Sheet)
 * - Estado de Resultados (Income Statement)
 * - Balance de Comprobación (Trial Balance)
 * - Libro Mayor (General Ledger)
 *
 * All reports follow PCGE (Plan Contable General Empresarial) format.
 */

import { inject, SERVICE_TOKENS, type ServiceToken } from "../lib/di-container";

// ============================================
// TYPES
// ============================================

/**
 * ReportType type.
 *
 * @example
 * ```ts
 * const value: ReportType = {} as ReportType;
 * console.log(value);
 * ```
 */
export type ReportType =
	| "BALANCE_GENERAL"
	| "ESTADO_RESULTADOS"
	| "BALANCE_COMPROBACION"
	| "LIBRO_MAYOR";

/**
 * ReportPeriod interface.
 *
 * @example
 * ```ts
 * const value: ReportPeriod = {} as ReportPeriod;
 * console.log(value);
 * ```
 */
export interface ReportPeriod {
	startDate: Date;
	endDate: Date;
}

/**
 * AccountBalance interface.
 *
 * @example
 * ```ts
 * const value: AccountBalance = {} as AccountBalance;
 * console.log(value);
 * ```
 */
export interface AccountBalance {
	accountCode: string;
	accountName: string;
	level: number;
	debit: number;
	credit: number;
	balance: number; // Saldo (Debit - Credit or Credit - Debit based on account nature)
	nature: "DEBIT" | "CREDIT";
}

/**
 * TrialBalanceReport interface.
 *
 * @example
 * ```ts
 * const value: TrialBalanceReport = {} as TrialBalanceReport;
 * console.log(value);
 * ```
 */
export interface TrialBalanceReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	accounts: AccountBalance[];
	totals: {
		totalDebit: number;
		totalCredit: number;
		difference: number;
	};
}

/**
 * BalanceSheetReport interface.
 *
 * @example
 * ```ts
 * const value: BalanceSheetReport = {} as BalanceSheetReport;
 * console.log(value);
 * ```
 */
export interface BalanceSheetReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	assets: {
		current: AccountBalance[]; // Activo Corriente (1)
		nonCurrent: AccountBalance[]; // Activo No Corriente (2-3)
		totalAssets: number;
	};
	liabilities: {
		current: AccountBalance[]; // Pasivo Corriente (4)
		nonCurrent: AccountBalance[]; // Pasivo No Corriente (4)
		totalLiabilities: number;
	};
	equity: {
		items: AccountBalance[]; // Patrimonio (5)
		totalEquity: number;
	};
	totalLiabilitiesAndEquity: number;
	balanced: boolean;
}

/**
 * IncomeStatementReport interface.
 *
 * @example
 * ```ts
 * const value: IncomeStatementReport = {} as IncomeStatementReport;
 * console.log(value);
 * ```
 */
export interface IncomeStatementReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	revenue: {
		operatingRevenue: AccountBalance[]; // Ventas (70)
		otherRevenue: AccountBalance[]; // Otros ingresos (75)
		totalRevenue: number;
	};
	costOfSales: {
		items: AccountBalance[]; // Costo de ventas (69)
		total: number;
	};
	grossProfit: number;
	operatingExpenses: {
		administrative: AccountBalance[]; // Gastos admin (94)
		selling: AccountBalance[]; // Gastos ventas (95)
		total: number;
	};
	operatingIncome: number;
	otherIncomeExpense: {
		financialIncome: AccountBalance[]; // Ingresos financieros (77)
		financialExpense: AccountBalance[]; // Gastos financieros (67)
		total: number;
	};
	incomeBeforeTax: number;
	incomeTax: number;
	netIncome: number;
}

/**
 * LedgerEntry interface.
 *
 * @example
 * ```ts
 * const value: LedgerEntry = {} as LedgerEntry;
 * console.log(value);
 * ```
 */

/**
 * LedgerAccountReport interface.
 *
 * @example
 * ```ts
 * const value: LedgerAccountReport = {} as LedgerAccountReport;
 * console.log(value);
 * ```
 */
export interface LedgerAccountReport {
	accountCode: string;
	accountName: string;
	period: ReportPeriod;
	openingBalance: number;
	entries: LedgerEntry[];
	closingBalance: number;
}

/**
 * GeneralLedgerReport interface.
 *
 * @example
 * ```ts
 * const value: GeneralLedgerReport = {} as GeneralLedgerReport;
 * console.log(value);
 * ```
 */
export interface GeneralLedgerReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	accounts: LedgerAccountReport[];
}

// ============================================
// ACCOUNT CLASSIFICATION (PCGE)
// ============================================

/**
 * Classify account by first digit(s) according to PCGE
 */
function classifyAccount(code: string): {
	class: number;
	isAsset: boolean;
	isLiability: boolean;
	isEquity: boolean;
	isRevenue: boolean;
	isExpense: boolean;
	isCost: boolean;
	nature: "DEBIT" | "CREDIT";
} {
	const firstDigit = parseInt(code.charAt(0), 10);
	const firstTwoDigits = parseInt(code.substring(0, 2), 10);

	// PCGE Classification:
	// 1: Activo disponible y exigible (Current Assets)
	// 2: Activo realizable (Inventory)
	// 3: Activo inmovilizado (Fixed Assets)
	// 4: Pasivo (Liabilities)
	// 5: Patrimonio (Equity)
	// 6: Gastos por naturaleza (Expenses)
	// 7: Ingresos (Revenue)
	// 8: Saldos intermediarios de gestión
	// 9: Contabilidad analítica de explotación
	// 0: Cuentas de orden

	const isAsset = firstDigit >= 1 && firstDigit <= 3;
	const isLiability = firstDigit === 4;
	const isEquity = firstDigit === 5;
	const isExpense = firstDigit === 6 || firstDigit === 9;
	const isRevenue = firstDigit === 7;
	const isCost = firstTwoDigits === 69; // Costo de ventas

	// Debit-nature accounts: Assets, Expenses, Costs
	// Credit-nature accounts: Liabilities, Equity, Revenue
	const nature: "DEBIT" | "CREDIT" =
		isAsset || isExpense || isCost ? "DEBIT" : "CREDIT";

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

// ============================================
// REPORT SERVICE
// ============================================

// ============================================
// INTERFACES SEGREGADAS (ISP Compliance)
// ============================================

/**
 * Interface for services that need account balances data
 * Single Responsibility: Account balance retrieval
 * @example
 * ```ts
 * const value: BalanceReportDataSource = {} as BalanceReportDataSource;
 * console.log(value);
 * ```
 */

export interface BalanceReportDataSource {
	getAccountBalances(
		organizationId: number,
		startDate: Date,
		endDate: Date,
	): Promise<{
		accounts: AccountBalance[];
		totals: {
			totalDebit: number;
			totalCredit: number;
		};
	}>;
}

/**
 * Interface for services that need ledger entries data
 * Single Responsibility: Ledger entry retrieval
 * @example
 * ```ts
 * const value: LedgerReportDataSource = {} as LedgerReportDataSource;
 * console.log(value);
 * ```
 */

export interface LedgerReportDataSource {
	getLedgerEntries(
		organizationId: number,
		accountCode: string,
		startDate: Date,
		endDate: Date,
	): Promise<LedgerEntry[]>;
}

/**
 * Interface for services that need organization information
 * Single Responsibility: Organization data retrieval
 * @example
 * ```ts
 * const value: OrganizationReportDataSource = {} as OrganizationReportDataSource;
 * console.log(value);
 * ```
 */

export interface OrganizationReportDataSource {
	getOrganizationInfo(organizationId: number): Promise<{
		name: string;
		ruc: string;
	}>;
}

/**
 * Interface for services that need opening balance calculations
 * Single Responsibility: Opening balance computation
 * @example
 * ```ts
 * const value: OpeningBalanceDataSource = {} as OpeningBalanceDataSource;
 * console.log(value);
 * ```
 */

export interface OpeningBalanceDataSource {
	getOpeningBalance(
		organizationId: number,
		accountCode: string,
		beforeDate: Date,
	): Promise<number>;
}

/**
 * @deprecated Use segregated interfaces instead
 * Kept for backward compatibility during transition
 * @example
 * ```ts
 * const value: ReportDataSource = {} as ReportDataSource;
 * console.log(value);
 * ```
 */

export interface ReportDataSource
	extends BalanceReportDataSource,
		LedgerReportDataSource,
		OrganizationReportDataSource,
		OpeningBalanceDataSource {}

/**
 * FinancialReportsService class.
 *
 * @example
 * ```ts
 * const value = new FinancialReportsService();
 * console.log(value);
 * ```
 */
export class FinancialReportsService {
	private readonly balanceDataSource: BalanceReportDataSource;
	private readonly organizationDataSource: OrganizationReportDataSource;
	private readonly ledgerDataSource?: LedgerReportDataSource;
	private readonly openingBalanceDataSource?: OpeningBalanceDataSource;

	constructor() {
		// Dependency injection via container (DIP compliance)
		this.balanceDataSource = this.requireDependency(
			SERVICE_TOKENS.BALANCE_REPORT_DATA_SOURCE,
			"BALANCE_REPORT_DATA_SOURCE",
		);
		this.organizationDataSource = this.requireDependency(
			SERVICE_TOKENS.ORGANIZATION_REPORT_DATA_SOURCE,
			"ORGANIZATION_REPORT_DATA_SOURCE",
		);
		this.ledgerDataSource = inject(
			SERVICE_TOKENS.LEDGER_REPORT_DATA_SOURCE as ServiceToken<LedgerReportDataSource>,
		);
		this.openingBalanceDataSource = inject(
			SERVICE_TOKENS.OPENING_BALANCE_DATA_SOURCE as ServiceToken<OpeningBalanceDataSource>,
		);
	}

	private requireDependency<T>(token: ServiceToken<unknown>, name: string): T {
		const dependency = inject(token as ServiceToken<T>);
		if (!dependency) {
			throw new Error(`Missing dependency: ${name}`);
		}
		return dependency;
	}

	/**
	 * Generate Trial Balance (Balance de Comprobación)
	 */
	async generateTrialBalance(
		organizationId: number,
		period: ReportPeriod,
	): Promise<TrialBalanceReport> {
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

	/**
	 * Generate Balance Sheet (Balance General)
	 */
	async generateBalanceSheet(
		organizationId: number,
		period: ReportPeriod,
	): Promise<BalanceSheetReport> {
		const [orgInfo, accountData] = await Promise.all([
			this.organizationDataSource.getOrganizationInfo(organizationId),
			this.balanceDataSource.getAccountBalances(
				organizationId,
				period.startDate,
				period.endDate,
			),
		]);

		const { accounts } = accountData;

		// Classify accounts
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
				// Simplified: treat all as current for now
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

	/**
	 * Generate Income Statement (Estado de Resultados)
	 */
	async generateIncomeStatement(
		organizationId: number,
		period: ReportPeriod,
	): Promise<IncomeStatementReport> {
		const [orgInfo, accountData] = await Promise.all([
			this.organizationDataSource.getOrganizationInfo(organizationId),
			this.balanceDataSource.getAccountBalances(
				organizationId,
				period.startDate,
				period.endDate,
			),
		]);

		const { accounts } = accountData;

		// Classify revenue and expense accounts
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

			// Revenue classification
			if (twoDigits === "70") {
				operatingRevenue.push(account);
			} else if (twoDigits === "75" || twoDigits === "76") {
				otherRevenue.push(account);
			} else if (twoDigits === "77") {
				financialIncome.push(account);
			}

			// Expense classification
			else if (twoDigits === "69") {
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

		// Peru income tax rate: 29.5% for corporations
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

	/**
	 * Generate General Ledger (Libro Mayor)
	 */
	async generateGeneralLedger(
		organizationId: number,
		period: ReportPeriod,
		accountCodes?: string[], // Optional: specific accounts
	): Promise<GeneralLedgerReport> {
		const orgInfo =
			await this.organizationDataSource.getOrganizationInfo(organizationId);

		// Get all accounts with balances
		const accountData = await this.balanceDataSource.getAccountBalances(
			organizationId,
			period.startDate,
			period.endDate,
		);

		const { accounts: allAccounts } = accountData;

		// Filter if specific accounts requested
		// O(n+m) optimization: Use Set for O(1) lookup
		const accountsToProcess = accountCodes
			? (() => {
					const codeSet = new Set(accountCodes);
					return allAccounts.filter((a) => codeSet.has(a.accountCode));
				})()
			: allAccounts;

		const ledgerAccounts: LedgerAccountReport[] = [];

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

			// Calculate running balances
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

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * createFinancialReportsService operation.
 *
 * @returns Result of createFinancialReportsService.
 * @example
 * ```ts
 * const result = createFinancialReportsService();
 * console.log(result);
 * ```
 */
export function createFinancialReportsService(): FinancialReportsService {
	return new FinancialReportsService();
}
