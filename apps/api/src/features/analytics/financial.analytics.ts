import { Money } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";
import {
	type AnalyticsOptions,
	type FinancialKPIs,
	toMoneyValue,
} from "./types/analytics.types";

/**
 * Financial Analytics Module
 *
 * Calculates comprehensive financial KPIs including revenue, growth,
 * outstanding amounts, and projections.
 *
 * **Metrics Calculated**:
 * - `totalRevenue`: Sum of all paid invoices (lifetime)
 * - `monthlyRevenue`: Sum of paid invoices in current calendar month
 * - `averageInvoiceValue`: Monthly revenue ÷ invoice count (0 if no invoices)
 * - `outstandingAmount`: Sum of SENT and OVERDUE invoices (accounts receivable)
 * - `collectedAmount`: Alias for monthlyRevenue
 * - `projectedRevenue`: monthlyRevenue × 1.1 (10% projection)
 * - `revenueGrowth`: Month-over-month percentage change
 * - `monthOverMonthGrowth`: (Current - Previous) / Previous × 100
 */
export class FinancialAnalytics {
	/**
	 * Calculate comprehensive financial KPIs for a company.
	 *
	 * @param options - Analytics options (companyId, currency required)
	 * @returns Promise resolving to financial KPIs object with Money-typed values
	 */
	static async getKPIs(options: AnalyticsOptions): Promise<FinancialKPIs> {
		const { companyId, currency = "PEN" } = options;

		const totalRevenueResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, currency),
				),
			);

		const totalRevenue = Money.fromAmount(
			Number(totalRevenueResult[0]?.total || "0"),
			currency,
		);

		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const monthlyRevenueResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				count: sql<number>`COUNT(*)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, currency),
					gte(invoices.issueDate, monthStart),
					lte(invoices.issueDate, monthEnd),
				),
			);

		const monthlyRevenue = Money.fromAmount(
			Number(monthlyRevenueResult[0]?.total || "0"),
			currency,
		);
		const monthlyCount = monthlyRevenueResult[0]?.count || 0;
		const averageValue =
			monthlyCount > 0
				? monthlyRevenue.divide(monthlyCount)
				: Money.zero(currency);

		const outstandingResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					sql`${invoices.status} IN ('SENT', 'OVERDUE')`,
					eq(invoices.currency, currency),
				),
			);

		const outstandingAmount = Money.fromAmount(
			Number(outstandingResult[0]?.total || "0"),
			currency,
		);

		// Prev Month for Growth
		const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

		const prevMonthResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, currency),
					gte(invoices.issueDate, prevMonthStart),
					lte(invoices.issueDate, prevMonthEnd),
				),
			);

		const prevMonthRevenue = Money.fromAmount(
			Number(prevMonthResult[0]?.total || "0"),
			currency,
		);
		const monthOverMonthGrowth = prevMonthRevenue.isZero()
			? 0
			: ((monthlyRevenue.toNumber() - prevMonthRevenue.toNumber()) /
					prevMonthRevenue.toNumber()) *
				100;

		return {
			totalRevenue: toMoneyValue(totalRevenue),
			monthlyRevenue: toMoneyValue(monthlyRevenue),
			averageInvoiceValue: toMoneyValue(averageValue),
			outstandingAmount: toMoneyValue(outstandingAmount),
			collectedAmount: toMoneyValue(monthlyRevenue),
			projectedRevenue: toMoneyValue(monthlyRevenue.multiply(1.1)),
			revenueGrowth: monthOverMonthGrowth,
			monthOverMonthGrowth,
		};
	}
}
