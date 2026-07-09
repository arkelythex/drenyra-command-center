export type ReportType =
	| "BALANCE_GENERAL"
	| "ESTADO_RESULTADOS"
	| "BALANCE_COMPROBACION"
	| "LIBRO_MAYOR";

export interface ReportPeriod {
	startDate: Date;
	endDate: Date;
}

export interface AccountBalance {
	accountCode: string;
	accountName: string;
	level: number;
	debit: number;
	credit: number;
	balance: number;
	nature: "DEBIT" | "CREDIT";
}

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

export interface BalanceSheetReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	assets: {
		current: AccountBalance[];
		nonCurrent: AccountBalance[];
		totalAssets: number;
	};
	liabilities: {
		current: AccountBalance[];
		nonCurrent: AccountBalance[];
		totalLiabilities: number;
	};
	equity: {
		items: AccountBalance[];
		totalEquity: number;
	};
	totalLiabilitiesAndEquity: number;
	balanced: boolean;
}

export interface IncomeStatementReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	revenue: {
		operatingRevenue: AccountBalance[];
		otherRevenue: AccountBalance[];
		totalRevenue: number;
	};
	costOfSales: {
		items: AccountBalance[];
		total: number;
	};
	grossProfit: number;
	operatingExpenses: {
		administrative: AccountBalance[];
		selling: AccountBalance[];
		total: number;
	};
	operatingIncome: number;
	otherIncomeExpense: {
		financialIncome: AccountBalance[];
		financialExpense: AccountBalance[];
		total: number;
	};
	incomeBeforeTax: number;
	incomeTax: number;
	netIncome: number;
}

export interface LedgerEntry {
	date: Date;
	reference: string;
	journalEntryNumber: string;
	description: string;
	debit: number;
	credit: number;
	runningBalance: number;
}

export interface LedgerAccountReport {
	accountCode: string;
	accountName: string;
	period: ReportPeriod;
	openingBalance: number;
	entries: LedgerEntry[];
	closingBalance: number;
}

export interface GeneralLedgerReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	accounts: LedgerAccountReport[];
}

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

export interface LedgerReportDataSource {
	getLedgerEntries(
		organizationId: number,
		accountCode: string,
		startDate: Date,
		endDate: Date,
	): Promise<LedgerEntry[]>;
}

export interface OrganizationReportDataSource {
	getOrganizationInfo(organizationId: number): Promise<{
		name: string;
		ruc: string;
	}>;
}

export interface OpeningBalanceDataSource {
	getOpeningBalance(
		organizationId: number,
		accountCode: string,
		beforeDate: Date,
	): Promise<number>;
}

export interface ReportDataSource
	extends BalanceReportDataSource,
		LedgerReportDataSource,
		OrganizationReportDataSource,
		OpeningBalanceDataSource {}

export function classifyAccount(code: string): {
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

	const isAsset = firstDigit >= 1 && firstDigit <= 3;
	const isLiability = firstDigit === 4;
	const isEquity = firstDigit === 5;
	const isExpense = firstDigit === 6 || firstDigit === 9;
	const isRevenue = firstDigit === 7;
	const isCost = firstTwoDigits === 69;

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
