import { Money } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, lte, sql } from "@arkelythex/persistence/query";
import {
	analyticsDashboards,
	analyticsWidgets,
	invoices,
} from "@arkelythex/persistence/schema";
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

		const aggregateAmount = async (
			statusFilter: string | string[],
			dateStart?: Date,
			dateEnd?: Date,
		) => {
			const conditions: any[] = [
				eq(invoices.companyId, companyId),
				eq(invoices.currency, cur),
			];

			if (Array.isArray(statusFilter)) {
				const quoted = statusFilter.map((s) => `'${s}'`).join(", ");
				conditions.push(sql(`"invoices"."status" IN (${quoted})`));
			} else {
				conditions.push(eq(invoices.status, statusFilter));
			}

			if (dateStart) conditions.push(gte(invoices.issueDate, dateStart));
			if (dateEnd) conditions.push(lte(invoices.issueDate, dateEnd));

			const result = await db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(invoices)
				.where(and(...conditions));

			return Money.fromAmount(Number(result[0]?.total || "0"), cur);
		};

		const countStatus = async (statusFilter: string) => {
			const result = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						eq(invoices.status, statusFilter),
					),
				);
			return result[0]?.count || 0;
		};

		const totalRevenue = await aggregateAmount("PAID");
		const monthlyRevenue = await aggregateAmount("PAID", monthStart, monthEnd);
		const quarterlyRevenue = await aggregateAmount(
			"PAID",
			quarterStart,
			quarterEnd,
		);
		const yearlyRevenue = await aggregateAmount("PAID", yearStart, yearEnd);

		const totalExpenses = await aggregateAmount("PAID");
		const monthlyExpenses = await aggregateAmount("PAID", monthStart, monthEnd);

		const accountsReceivable = await aggregateAmount(["SENT", "OVERDUE"]);
		const accountsPayable = Money.zero(cur);

		const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
		const prevMonthRevenue = await aggregateAmount(
			"PAID",
			prevMonthStart,
			prevMonthEnd,
		);

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
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
					gte(
						invoices.issueDate,
						new Date(now.getFullYear() - 1, now.getMonth(), 1),
					),
				),
			)
			.groupBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`);

		const expenseTrendResults = await db
			.select({
				month: sql<string>`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
					gte(
						invoices.issueDate,
						new Date(now.getFullYear() - 1, now.getMonth(), 1),
					),
				),
			)
			.groupBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`);

		const netProfit = totalRevenue;
		const profitMargin = totalRevenue.isZero()
			? 0
			: (netProfit.toNumber() / totalRevenue.toNumber()) * 100;

		const prevMonthProfit = prevMonthRevenue;
		const profitGrowth = prevMonthProfit.isZero()
			? 0
			: ((netProfit.toNumber() - prevMonthProfit.toNumber()) /
					prevMonthProfit.toNumber()) *
				100;

		const churned = await countStatus("CANCELLED");

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
				expenseTrend: expenseTrendResults.map((r) => ({
					month: r.month,
					amount: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
				})),
			},
			profit: {
				grossProfit: toMoneyValue(netProfit),
				netProfit: toMoneyValue(netProfit),
				profitMargin,
				profitTrend: revenueByMonthResults.map((r) => ({
					month: r.month,
					profit: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
				})),
				monthOverMonthGrowth: profitGrowth,
			},
			liquidity: {
				currentRatio: totalRevenue.isZero()
					? 1
					: totalRevenue.toNumber() /
						(totalExpenses.isZero() ? 1 : totalExpenses.toNumber()),
				quickRatio: totalRevenue.isZero()
					? 1
					: totalRevenue.toNumber() /
						(totalExpenses.isZero() ? 1 : totalExpenses.toNumber()),
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
			.orderBy(analyticsDashboards.updatedAt)
			.limit(1);

		if (dashboards.length === 0) return null;

		const dashboard = dashboards[0];
		const widgets = await db
			.select()
			.from(analyticsWidgets)
			.where(eq(analyticsWidgets.dashboardId, dashboard.id));

		return { ...dashboard, widgets };
	}
}
