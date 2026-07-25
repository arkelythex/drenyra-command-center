import type { LedgerEntry } from "./financial-reports/types";
/**
 * Financial Reports types — PCGE report interfaces.
 */

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
	totals: { totalDebit: number; totalCredit: number; difference: number };
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
	equity: { items: AccountBalance[]; totalEquity: number };
	totalLiabilitiesAndEquity: number;
	balanced: boolean;
}

export interface IncomeStatementReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	revenue: {
		operations: AccountBalance[];
		nonOperations: AccountBalance[];
		totalRevenue: number;
	};
	expenses: {
		costOfSales: AccountBalance[];
		operating: AccountBalance[];
		nonOperating: AccountBalance[];
		totalExpenses: number;
	};
	grossProfit: number;
	operatingProfit: number;
	netProfit: number;
	effectiveRate: number;
}

export interface GeneralLedgerReport {
	period: ReportPeriod;
	generatedAt: Date;
	organizationName: string;
	ruc: string;
	accounts: {
		accountCode: string;
		accountName: string;
		entries: LedgerEntry[];
		startingBalance: number;
		endingBalance: number;
	}[];
}

export interface ReportGenerationResult {
	success: boolean;
	reportType: ReportType;
	period: ReportPeriod;
	data: unknown;
	generatedAt: Date;
	error?: string;
}

export interface ReportOptions {
	companyId: string;
	period: ReportPeriod;
	includeSubaccounts?: boolean;
	format?: "json" | "pdf" | "excel";
}
