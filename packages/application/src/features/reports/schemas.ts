import { z } from "zod";

const MoneyStringSchema = z.string().regex(/^-?\d+\.\d{2}$/);

const DateRangeFields = {
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
} as const;

/**
 * ReportsDateRangeQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(ReportsDateRangeQuerySchema);
 * ```
 */
export const ReportsDateRangeQuerySchema = z
	.object(DateRangeFields)
	.refine((value) => value.endDate >= value.startDate, {
		path: ["endDate"],
		message: "endDate must be greater than or equal to startDate",
	});

/**
 * ReportsAsOfDateQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(ReportsAsOfDateQuerySchema);
 * ```
 */
export const ReportsAsOfDateQuerySchema = z.object({
	asOfDate: z.coerce.date(),
});

/**
 * ProfitLossReportSchema const.
 *
 * @example
 * ```ts
 * console.log(ProfitLossReportSchema);
 * ```
 */
export const ProfitLossReportSchema = z.object({
	period: z.object({
		startDate: z.date(),
		endDate: z.date(),
	}),
	revenue: MoneyStringSchema,
	expenses: MoneyStringSchema,
	netIncome: MoneyStringSchema,
});

/**
 * BalanceSheetReportSchema const.
 *
 * @example
 * ```ts
 * console.log(BalanceSheetReportSchema);
 * ```
 */
export const BalanceSheetReportSchema = z.object({
	asOfDate: z.date(),
	assets: z.object({
		total: MoneyStringSchema,
	}),
	liabilities: z.object({
		total: MoneyStringSchema,
	}),
	equity: z.object({
		total: MoneyStringSchema,
	}),
});

/**
 * CashFlowReportSchema const.
 *
 * @example
 * ```ts
 * console.log(CashFlowReportSchema);
 * ```
 */
export const CashFlowReportSchema = z.object({
	period: z.object({
		startDate: z.date(),
		endDate: z.date(),
	}),
	operating: MoneyStringSchema,
	investing: MoneyStringSchema,
	financing: MoneyStringSchema,
	netCashFlow: MoneyStringSchema,
});

/**
 * SalesByCustomerRowSchema const.
 *
 * @example
 * ```ts
 * console.log(SalesByCustomerRowSchema);
 * ```
 */
export const SalesByCustomerRowSchema = z.object({
	customerId: z.string().nullable(),
	total: MoneyStringSchema,
	count: z.number().int().nonnegative(),
});

/**
 * SalesByCustomerReportSchema const.
 *
 * @example
 * ```ts
 * console.log(SalesByCustomerReportSchema);
 * ```
 */
export const SalesByCustomerReportSchema = z.array(SalesByCustomerRowSchema);

/**
 * ReportsDateRangeQuery type.
 *
 * @example
 * ```ts
 * const value: ReportsDateRangeQuery = {} as ReportsDateRangeQuery;
 * console.log(value);
 * ```
 */
export type ReportsDateRangeQuery = z.infer<typeof ReportsDateRangeQuerySchema>;
/**
 * ReportsAsOfDateQuery type.
 *
 * @example
 * ```ts
 * const value: ReportsAsOfDateQuery = {} as ReportsAsOfDateQuery;
 * console.log(value);
 * ```
 */
export type ReportsAsOfDateQuery = z.infer<typeof ReportsAsOfDateQuerySchema>;
/**
 * ProfitLossReport type.
 *
 * @example
 * ```ts
 * const value: ProfitLossReport = {} as ProfitLossReport;
 * console.log(value);
 * ```
 */
export type ProfitLossReport = z.infer<typeof ProfitLossReportSchema>;
/**
 * BalanceSheetReport type.
 *
 * @example
 * ```ts
 * const value: BalanceSheetReport = {} as BalanceSheetReport;
 * console.log(value);
 * ```
 */
export type BalanceSheetReport = z.infer<typeof BalanceSheetReportSchema>;
/**
 * CashFlowReport type.
 *
 * @example
 * ```ts
 * const value: CashFlowReport = {} as CashFlowReport;
 * console.log(value);
 * ```
 */
export type CashFlowReport = z.infer<typeof CashFlowReportSchema>;
/**
 * SalesByCustomerRow type.
 *
 * @example
 * ```ts
 * const value: SalesByCustomerRow = {} as SalesByCustomerRow;
 * console.log(value);
 * ```
 */
export type SalesByCustomerRow = z.infer<typeof SalesByCustomerRowSchema>;
