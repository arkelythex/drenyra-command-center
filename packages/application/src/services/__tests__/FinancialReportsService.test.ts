/**
 * Financial Reports Service Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { register, SERVICE_TOKENS } from "../../lib/di-container";
import {
	type AccountBalance,
	createFinancialReportsService,
	type FinancialReportsService,
	type LedgerEntry,
	type ReportDataSource,
} from "../FinancialReportsService";

describe("FinancialReportsService", () => {
	let mockDataSource: ReportDataSource;
	let service: FinancialReportsService;

	const mockOrgInfo = {
		name: "EMPRESA TEST SAC",
		ruc: "20123456789",
	};

	const mockPeriod = {
		startDate: new Date("2025-01-01"),
		endDate: new Date("2025-01-31"),
	};

	const createAccountBalance = (
		overrides: Partial<AccountBalance> = {},
	): AccountBalance => ({
		accountCode: "1011",
		accountName: "Caja",
		level: 1,
		debit: 1000,
		credit: 0,
		balance: 1000,
		nature: "DEBIT",
		...overrides,
	});

	const mockBalances = (accounts: AccountBalance[]) => {
		const totals = accounts.reduce(
			(acc, a) => ({
				totalDebit: acc.totalDebit + a.debit,
				totalCredit: acc.totalCredit + a.credit,
			}),
			{ totalDebit: 0, totalCredit: 0 },
		);
		return { accounts, totals };
	};

	beforeEach(() => {
		mockDataSource = {
			getAccountBalances: vi.fn().mockResolvedValue(mockBalances([])),
			getLedgerEntries: vi.fn().mockResolvedValue([]),
			getOrganizationInfo: vi.fn().mockResolvedValue(mockOrgInfo),
			getOpeningBalance: vi.fn().mockResolvedValue(0),
		};
		register(SERVICE_TOKENS.BALANCE_REPORT_DATA_SOURCE, mockDataSource);
		register(SERVICE_TOKENS.ORGANIZATION_REPORT_DATA_SOURCE, mockDataSource);
		register(SERVICE_TOKENS.LEDGER_REPORT_DATA_SOURCE, mockDataSource);
		register(SERVICE_TOKENS.OPENING_BALANCE_DATA_SOURCE, mockDataSource);
		service = createFinancialReportsService();
	});

	describe("Trial Balance", () => {
		it("should generate trial balance with correct totals", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({
					accountCode: "1011",
					debit: 5000,
					credit: 0,
					balance: 5000,
				}),
				createAccountBalance({
					accountCode: "4011",
					debit: 0,
					credit: 3000,
					balance: -3000,
				}),
				createAccountBalance({
					accountCode: "7011",
					debit: 0,
					credit: 2000,
					balance: -2000,
				}),
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));

			const report = await service.generateTrialBalance(1, mockPeriod);

			expect(report.organizationName).toBe("EMPRESA TEST SAC");
			expect(report.ruc).toBe("20123456789");
			expect(report.accounts).toHaveLength(3);
			expect(report.totals.totalDebit).toBe(5000);
			expect(report.totals.totalCredit).toBe(5000);
			expect(report.totals.difference).toBe(0);
		});

		it("should detect unbalanced trial balance", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({ accountCode: "1011", debit: 5000, credit: 0 }),
				createAccountBalance({ accountCode: "4011", debit: 0, credit: 3000 }),
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));

			const report = await service.generateTrialBalance(1, mockPeriod);

			expect(report.totals.difference).toBe(2000);
		});

		it("should sort accounts by code", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({ accountCode: "7011" }),
				createAccountBalance({ accountCode: "1011" }),
				createAccountBalance({ accountCode: "4011" }),
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));

			const report = await service.generateTrialBalance(1, mockPeriod);

			expect(report.accounts[0]?.accountCode).toBe("1011");
			expect(report.accounts[1]?.accountCode).toBe("4011");
			expect(report.accounts[2]?.accountCode).toBe("7011");
		});
	});

	describe("Balance Sheet", () => {
		it("should classify accounts correctly", async () => {
			const accounts: AccountBalance[] = [
				// Assets (1)
				createAccountBalance({
					accountCode: "1011",
					accountName: "Caja",
					balance: 5000,
				}),
				createAccountBalance({
					accountCode: "1041",
					accountName: "Bancos",
					balance: 10000,
				}),
				// Fixed Assets (3)
				createAccountBalance({
					accountCode: "3311",
					accountName: "Edificios",
					balance: 50000,
				}),
				// Liabilities (4)
				createAccountBalance({
					accountCode: "4011",
					accountName: "Tributos por pagar",
					balance: -3000,
				}),
				createAccountBalance({
					accountCode: "4111",
					accountName: "Remuneraciones",
					balance: -2000,
				}),
				// Equity (5)
				createAccountBalance({
					accountCode: "5011",
					accountName: "Capital",
					balance: -50000,
				}),
				createAccountBalance({
					accountCode: "5911",
					accountName: "Utilidades",
					balance: -10000,
				}),
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));

			const report = await service.generateBalanceSheet(1, mockPeriod);

			expect(report.assets.current).toHaveLength(2);
			expect(report.assets.nonCurrent).toHaveLength(1);
			expect(report.assets.totalAssets).toBe(65000);

			expect(report.liabilities.current).toHaveLength(2);
			expect(report.liabilities.totalLiabilities).toBe(5000);

			expect(report.equity.items).toHaveLength(2);
			expect(report.equity.totalEquity).toBe(60000);

			expect(report.balanced).toBe(true);
		});

		it("should detect unbalanced balance sheet", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({ accountCode: "1011", balance: 10000 }),
				createAccountBalance({ accountCode: "5011", balance: -5000 }), // Not enough equity
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));

			const report = await service.generateBalanceSheet(1, mockPeriod);

			expect(report.balanced).toBe(false);
		});
	});

	describe("Income Statement", () => {
		it("should calculate net income correctly", async () => {
			const accounts: AccountBalance[] = [
				// Revenue (70)
				createAccountBalance({
					accountCode: "7011",
					accountName: "Ventas",
					balance: -100000,
				}),
				// Cost of Sales (69)
				createAccountBalance({
					accountCode: "6911",
					accountName: "Costo de ventas",
					balance: 60000,
				}),
				// Administrative Expenses (94)
				createAccountBalance({
					accountCode: "9411",
					accountName: "Gastos admin",
					balance: 15000,
				}),
				// Selling Expenses (95)
				createAccountBalance({
					accountCode: "9511",
					accountName: "Gastos ventas",
					balance: 10000,
				}),
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));

			const report = await service.generateIncomeStatement(1, mockPeriod);

			expect(report.revenue.totalRevenue).toBe(100000);
			expect(report.costOfSales.total).toBe(60000);
			expect(report.grossProfit).toBe(40000);
			expect(report.operatingExpenses.total).toBe(25000);
			expect(report.operatingIncome).toBe(15000);
			expect(report.incomeBeforeTax).toBe(15000);
			// Tax: 15000 * 0.295 = 4425
			expect(report.incomeTax).toBe(4425);
			expect(report.netIncome).toBe(10575);
		});

		it("should not calculate tax on losses", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({ accountCode: "7011", balance: -10000 }),
				createAccountBalance({ accountCode: "6911", balance: 15000 }), // Loss
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));

			const report = await service.generateIncomeStatement(1, mockPeriod);

			expect(report.netIncome).toBeLessThan(0);
			expect(report.incomeTax).toBe(0);
		});
	});

	describe("General Ledger", () => {
		it("should generate ledger with running balances", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({ accountCode: "1011", accountName: "Caja" }),
			];

			const entries: LedgerEntry[] = [
				{
					date: new Date("2025-01-05"),
					journalEntryNumber: "AS-001",
					description: "Aporte capital",
					debit: 10000,
					credit: 0,
					runningBalance: 0,
				},
				{
					date: new Date("2025-01-10"),
					journalEntryNumber: "AS-002",
					description: "Pago proveedor",
					debit: 0,
					credit: 3000,
					runningBalance: 0,
				},
				{
					date: new Date("2025-01-15"),
					journalEntryNumber: "AS-003",
					description: "Cobro cliente",
					debit: 5000,
					credit: 0,
					runningBalance: 0,
				},
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));
			vi.mocked(mockDataSource.getLedgerEntries).mockResolvedValue(entries);
			vi.mocked(mockDataSource.getOpeningBalance).mockResolvedValue(0);

			const report = await service.generateGeneralLedger(1, mockPeriod);

			expect(report.accounts).toHaveLength(1);

			const ledgerAccount = report.accounts[0];
			expect(ledgerAccount?.openingBalance).toBe(0);
			expect(ledgerAccount?.entries).toHaveLength(3);

			// Check running balances
			expect(ledgerAccount?.entries[0]?.runningBalance).toBe(10000);
			expect(ledgerAccount?.entries[1]?.runningBalance).toBe(7000);
			expect(ledgerAccount?.entries[2]?.runningBalance).toBe(12000);
			expect(ledgerAccount?.closingBalance).toBe(12000);
		});

		it("should include opening balance in calculations", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({ accountCode: "1011" }),
			];

			const entries: LedgerEntry[] = [
				{
					date: new Date("2025-01-05"),
					journalEntryNumber: "AS-001",
					description: "Movement",
					debit: 1000,
					credit: 0,
					runningBalance: 0,
				},
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));
			vi.mocked(mockDataSource.getLedgerEntries).mockResolvedValue(entries);
			vi.mocked(mockDataSource.getOpeningBalance).mockResolvedValue(5000); // Opening balance

			const report = await service.generateGeneralLedger(1, mockPeriod);

			const ledgerAccount = report.accounts[0];
			expect(ledgerAccount?.openingBalance).toBe(5000);
			expect(ledgerAccount?.entries[0]?.runningBalance).toBe(6000); // 5000 + 1000
			expect(ledgerAccount?.closingBalance).toBe(6000);
		});

		it("should filter by specific accounts", async () => {
			const accounts: AccountBalance[] = [
				createAccountBalance({ accountCode: "1011" }),
				createAccountBalance({ accountCode: "1041" }),
				createAccountBalance({ accountCode: "4011" }),
			];

			vi.mocked(mockDataSource.getAccountBalances).mockResolvedValue(mockBalances(accounts));
			vi.mocked(mockDataSource.getLedgerEntries).mockResolvedValue([]);

			const report = await service.generateGeneralLedger(1, mockPeriod, [
				"1011",
				"1041",
			]);

			expect(report.accounts).toHaveLength(2);
			expect(report.accounts.map((a) => a.accountCode)).toContain("1011");
			expect(report.accounts.map((a) => a.accountCode)).toContain("1041");
			expect(report.accounts.map((a) => a.accountCode)).not.toContain("4011");
		});
	});
});
