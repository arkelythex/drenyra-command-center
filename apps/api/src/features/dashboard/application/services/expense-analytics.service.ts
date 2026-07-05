import { db } from "@drenyra/persistence/client";
import { and, desc, eq, sql } from "@drenyra/persistence/query";
import { bills, businessPartners } from "@drenyra/persistence/schema";

/**
 * ExpenseAnalyticsService class.
 *
 * @example
 * ```ts
 * const value = new ExpenseAnalyticsService();
 * console.log(value);
 * ```
 */
export class ExpenseAnalyticsService {
	/** Budget execution and expense summary */
	static async getExpenses(
		companyId: string,
		startDate?: Date,
		endDate?: Date,
	) {
		const now = new Date();
		const start = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
		const end = endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

		// Total expenses in period
		const totals = await db
			.select({
				totalAmount: sql<string>`COALESCE(SUM(CAST(${bills.totalAmount} AS DECIMAL)), 0)`,
				totalIgv: sql<string>`COALESCE(SUM(CAST(${bills.igvAmount} AS DECIMAL)), 0)`,
				count: sql<number>`COUNT(*)`,
				paid: sql<number>`COUNT(*) FILTER (WHERE ${bills.status} = 'PAID')`,
			})
			.from(bills)
			.where(
				and(
					eq(bills.companyId, companyId),
					sql`${bills.issueDate} >= ${start}`,
					sql`${bills.issueDate} <= ${end}`,
				),
			);

		const row = totals[0] ?? {
			totalAmount: "0",
			totalIgv: "0",
			count: 0,
			paid: 0,
		};
		const paymentCompliance =
			row.count > 0 ? Math.round((row.paid / row.count) * 10000) / 100 : 0;

		// Expense by status (MVP: bills schema lacks PCGE category field)
		const byStatus = await db
			.select({
				status: bills.status,
				total: sql<string>`COALESCE(SUM(CAST(${bills.totalAmount} AS DECIMAL)), 0)`,
				count: sql<number>`COUNT(*)`,
			})
			.from(bills)
			.where(
				and(
					eq(bills.companyId, companyId),
					sql`${bills.issueDate} >= ${start}`,
					sql`${bills.issueDate} <= ${end}`,
				),
			)
			.groupBy(bills.status)
			.orderBy(desc(sql`SUM(CAST(${bills.totalAmount} AS DECIMAL))`));

		const totalExpense = parseFloat(row.totalAmount);
		const expenseByCategory = byStatus.map((c) => ({
			category: c.status ?? "Sin estado",
			total: parseFloat(c.total),
			count: c.count,
			percentage:
				totalExpense > 0
					? Math.round((parseFloat(c.total) / totalExpense) * 10000) / 100
					: 0,
		}));

		// Top vendors
		const topVendors = await db
			.select({
				vendorId: bills.vendorId,
				vendorName: businessPartners.legalName,
				ruc: businessPartners.taxId,
				total: sql<string>`COALESCE(SUM(CAST(${bills.totalAmount} AS DECIMAL)), 0)`,
				count: sql<number>`COUNT(*)`,
			})
			.from(bills)
			.leftJoin(businessPartners, eq(bills.vendorId, businessPartners.id))
			.where(
				and(
					eq(bills.companyId, companyId),
					sql`${bills.issueDate} >= ${start}`,
					sql`${bills.issueDate} <= ${end}`,
				),
			)
			.groupBy(
				bills.vendorId,
				businessPartners.legalName,
				businessPartners.taxId,
			)
			.orderBy(desc(sql`SUM(CAST(${bills.totalAmount} AS DECIMAL))`))
			.limit(10);

		return {
			budgetExecution: {
				totalExpenses: parseFloat(row.totalAmount),
				totalIgv: parseFloat(row.totalIgv),
				billCount: row.count,
				currency: "PEN" as const,
			},
			paymentCompliance,
			expenseByCategory,
			topVendors: topVendors.map((v) => ({
				vendorId: v.vendorId,
				vendorName: v.vendorName ?? "Desconocido",
				ruc: v.ruc ?? "",
				total: parseFloat(v.total),
				billCount: v.count,
			})),
		};
	}
}
