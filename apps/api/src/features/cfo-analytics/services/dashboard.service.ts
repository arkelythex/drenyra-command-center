import { Money } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, desc, eq, gte, lte, sql } from "@drenyra/persistence/query";
import {
	analyticsDashboards,
	analyticsWidgets,
	invoices,
} from "@drenyra/persistence/schema";
import type { DashboardConfig, DashboardKPIs } from "../cfo-analytics.types";
import { toMoneyValue } from "../cfo-analytics.types";

export class DashboardService {
	static async getDashboardKPIs(
		companyId: string,
		currency: string = "PEN",
	): Promise<DashboardKPIs> {
		const cur = currency as "PEN" | "USD";

		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const quarterStart = new Date(
			now.getFullYear(),
			Math.floor(now.getMonth() / 3) * 3,
			1,
		);
		const quarterEnd = new Date(
			now.getFullYear(),
			Math.floor(now.getMonth() / 3) * 3 + 3,
			0,
		);

		const yearStart = new Date(now.getFullYear(), 0, 1);
		const yearEnd = new Date(now.getFullYear(), 11, 31);

		const sumByStatusAndRange = async (
			status: string,
			start?: Date,
			end?: Date,
		) => {
			const conditions = [
				eq(invoices.companyId, companyId),
				eq(invoices.currency, cur),
				eq(invoices.status, status as any),
			];
			if (start) conditions.push(gte(invoices.issueDate, start));
			if (end) conditions.push(lte(invoices.issueDate, end));

			const result = await db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(invoices)
				.where(and(...conditions));
			return Money.fromAmount(Number(result[0]?.total || "0"), cur);
		};

		const sumReceivable = async () => {
			const result = await db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						eq(invoices.currency, cur),
						sql`${invoices.status} IN ('SENT', 'OVERDUE')`,
					),
				);
			return Money.fromAmount(Number(result[0]?.total || "0"), cur);
		};

		const [
			totalRevenue,
			monthlyRevenue,
			quarterlyRevenue,
			yearlyRevenue,
			prevMonthRevenue,
			accountsReceivable,
		] = await Promise.all([
			sumByStatusAndRange("PAID"),
			sumByStatusAndRange("PAID", monthStart, monthEnd),
			sumByStatusAndRange("PAID", quarterStart, quarterEnd),
			sumByStatusAndRange("PAID", yearStart, yearEnd),
			sumByStatusAndRange(
				"PAID",
				new Date(now.getFullYear(), now.getMonth() - 1, 1),
				new Date(now.getFullYear(), now.getMonth(), 0),
			),
			sumReceivable(),
		]);

		const totalExpenses = totalRevenue;
		const monthlyExpenses = monthlyRevenue;
		const accountsPayable = Money.zero(cur);
		const revenueGrowth = prevMonthRevenue.isZero()
			? 0
			: ((monthlyRevenue.toNumber() - prevMonthRevenue.toNumber()) /
					prevMonthRevenue.toNumber()) *
				100;

		const revenueByMonthResults = await db
			.select({
				month: sql<string>`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID" as any),
					eq(invoices.currency, cur),
					gte(
						invoices.issueDate,
						new Date(now.getFullYear() - 1, now.getMonth(), 1),
					),
				),
			)
			.groupBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`);

		const profitMargin = totalRevenue.isZero() ? 0 : 100;
		const prevMonthProfit = prevMonthRevenue;
		const profitGrowth = prevMonthProfit.isZero()
			? 0
			: ((monthlyRevenue.toNumber() - prevMonthProfit.toNumber()) /
					prevMonthProfit.toNumber()) *
				100;

		const churnedResult = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "CANCELLED" as any),
				),
			);
		const churned = churnedResult[0]?.count || 0;

		return {
			revenue: {
				totalRevenue: toMoneyValue(totalRevenue),
				monthlyRevenue: toMoneyValue(monthlyRevenue),
				quarterlyRevenue: toMoneyValue(quarterlyRevenue),
				yearlyRevenue: toMoneyValue(yearlyRevenue),
				revenueGrowth,
				revenueByMonth: revenueByMonthResults.map((r) => ({
					month: r.month,
					revenue: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
				})),
			},
			expenses: {
				totalExpenses: toMoneyValue(totalExpenses),
				monthlyExpenses: toMoneyValue(monthlyExpenses),
				expensesByCategory: [],
				expenseTrend: revenueByMonthResults.map((r) => ({
					month: r.month,
					amount: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
				})),
			},
			profit: {
				grossProfit: toMoneyValue(monthlyRevenue),
				netProfit: toMoneyValue(monthlyRevenue),
				profitMargin,
				profitTrend: revenueByMonthResults.map((r) => ({
					month: r.month,
					profit: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
				})),
				monthOverMonthGrowth: profitGrowth,
			},
			liquidity: {
				currentRatio: 1,
				quickRatio: 1,
				cashAndEquivalents: toMoneyValue(totalRevenue),
				accountsReceivable: toMoneyValue(accountsReceivable),
				accountsPayable: toMoneyValue(accountsPayable),
			},
			tax: {
				complianceScore: 85,
				monthlyIGV: toMoneyValue(monthlyRevenue.multiply(0.18)),
				totalTaxLiability: toMoneyValue(totalRevenue.multiply(0.18)),
				upcomingDeadlines: [],
				complianceByPeriod: [],
			},
			clients: {
				activeClients: 0,
				newClients: 0,
				churnedClients: churned,
				totalClients: 0,
				clientProfitability: [],
			},
		};
	}

	static async saveDashboardConfig(
		companyId: string,
		name: string,
		config: DashboardConfig,
		createdById?: string,
	) {
		const [dashboard] = await db
			.insert(analyticsDashboards)
			.values({
				companyId,
				name,
				config:
					config as unknown as (typeof analyticsDashboards.$inferInsert)["config"],
				createdById: createdById || null,
			})
			.returning();

		return dashboard;
	}

	static async getDashboardConfig(companyId: string) {
		const dashboards = await db
			.select()
			.from(analyticsDashboards)
			.where(eq(analyticsDashboards.companyId, companyId))
			.orderBy(desc(analyticsDashboards.updatedAt))
			.limit(1);

		if (dashboards.length === 0) return null;

		const dashboard = dashboards[0];
		if (!dashboard) return null;
		const widgets = await db
			.select()
			.from(analyticsWidgets)
			.where(eq(analyticsWidgets.dashboardId, dashboard.id));

		return { ...dashboard, widgets };
	}
}
