/**
 * v1 Reports Schemas
 *
 * Zod schemas for v1 reports API.
 * Refactored from reports.schemas.ts with additional fields.
 */

import { z } from "zod";

const ReportsDateRangeFields = {
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	currency: z.string().length(3).optional().default("PEN"),
};

export const ReportsDateRangeQuerySchema = z.object(ReportsDateRangeFields).refine((v) => v.endDate >= v.startDate, {
	path: ["endDate"],
	message: "endDate must be >= startDate",
});

/** Base schema without refine, for merging with other schemas. */
export const ReportsDateRangeBaseSchema = z.object(ReportsDateRangeFields);

export const ReportsAsOfDateQuerySchema = z.object({
	asOfDate: z.coerce.date(),
});

export const AccountCodeQuerySchema = z.object({
	accountCode: z.string().optional(),
});

export const ProfitLossReportSchema = z.object({
	period: z.object({ startDate: z.string(), endDate: z.string() }),
	revenue: z.array(z.object({ accountCode: z.string(), accountName: z.string(), amount: z.string() })),
	expenses: z.array(z.object({ accountCode: z.string(), accountName: z.string(), amount: z.string() })),
	netIncome: z.string(),
	generatedAt: z.string(),
});

export const BalanceSheetReportSchema = z.object({
	asOfDate: z.string(),
	assets: z.array(z.object({ accountCode: z.string(), accountName: z.string(), balance: z.string() })),
	liabilities: z.array(z.object({ accountCode: z.string(), accountName: z.string(), balance: z.string() })),
	equity: z.array(z.object({ accountCode: z.string(), accountName: z.string(), balance: z.string() })),
	totalAssets: z.string(),
	totalLiabilities: z.string(),
	totalEquity: z.string(),
	generatedAt: z.string(),
});

export const CashFlowReportSchema = z.object({
	period: z.object({ startDate: z.string(), endDate: z.string() }),
	operating: z.array(z.object({ category: z.string(), amount: z.string() })),
	investing: z.array(z.object({ category: z.string(), amount: z.string() })),
	financing: z.array(z.object({ category: z.string(), amount: z.string() })),
	netCashFlow: z.string(),
	generatedAt: z.string(),
});

export const SalesByCustomerReportSchema = z.object({
	period: z.object({ startDate: z.string(), endDate: z.string() }),
	customers: z.array(z.object({
		customerId: z.string(), customerName: z.string(), ruc: z.string(), totalSales: z.string(), invoiceCount: z.number(),
	})),
	totalSales: z.string(),
	generatedAt: z.string(),
});

export const TrialBalanceReportSchema = z.object({
	asOfDate: z.string(),
	accounts: z.array(z.object({
		accountCode: z.string(), accountName: z.string(), debitBalance: z.string(), creditBalance: z.string(),
	})),
	totalDebits: z.string(),
	totalCredits: z.string(),
	generatedAt: z.string(),
});

export const GeneralLedgerReportSchema = z.object({
	period: z.object({ startDate: z.string(), endDate: z.string() }),
	entries: z.array(z.object({
		date: z.string(), voucherNo: z.string(), accountCode: z.string(), description: z.string(), debit: z.string(), credit: z.string(), balance: z.string(),
	})),
	generatedAt: z.string(),
});
