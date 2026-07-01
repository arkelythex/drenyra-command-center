import { Money } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, lte, sql } from "@arkelythex/persistence/query";
import { invoices } from "@arkelythex/persistence/schema";
import type {
	ExpenseKPIs,
	LiquidityKPIs,
	MoneyValue,
	ProfitKPIs,
	RevenueKPIs,
} from "../cfo-analytics.types";
import { toMoneyValue } from "../cfo-analytics.types";

export class FinancialKPIsService {
	static async getRevenueKPIs(
		companyId: string,
		period: "monthly" | "quarterly" | "yearly" = "monthly",
		currency: string = "PEN",
	): Promise<RevenueKPIs> {
		const cur = currency as "PEN" | "USD";
		const now = new Date();

		const periodStart =
			period === "monthly"
				? new Date(now.getFullYear(), now.getMonth(), 1)
				: period === "quarterly"
					? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
					: new Date(now.getFullYear(), 0, 1);

		const periodEnd =
			period === "monthly"
				? new Date(now.getFullYear(), now.getMonth() + 1, 0)
				: period === "quarterly"
					? new Date(
							now.getFullYear(),
							Math.floor(now.getMonth() / 3) * 3 + 3,
							0,
						)
					: new Date(now.getFullYear(), 11, 31);

		const totalResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
				),
			);

		const totalRevenue = Money.fromAmount(
			Number(totalResult[0]?.total || "0"),
			cur,
		);

		const periodResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
					gte(invoices.issueDate, periodStart),
					lte(invoices.issueDate, periodEnd),
				),
			);

		const periodRevenue = Money.fromAmount(
			Number(periodResult[0]?.total || "0"),
			cur,
		);

		const prevStart = new Date(periodStart);
		prevStart.setMonth(
			prevStart.getMonth() -
				(period === "yearly" ? 12 : period === "quarterly" ? 3 : 1),
		);
		const prevEnd = new Date(periodStart);
		prevEnd.setDate(0);

		const prevResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
					gte(invoices.issueDate, prevStart),
					lte(invoices.issueDate, prevEnd),
				),
			);

		const prevRevenue = Money.fromAmount(
			Number(prevResult[0]?.total || "0"),
			cur,
		);
		const revenueGrowth = prevRevenue.isZero()
			? 0
			: ((periodRevenue.toNumber() - prevRevenue.toNumber()) /
					prevRevenue.toNumber()) *
				100;

		const dateTrunc =
			period === "monthly"
				? "YYYY-MM"
				: period === "quarterly"
					? "YYYY-Q"
					: "YYYY";

		const byPeriodResults = await db
			.select({
				period: sql<string>`TO_CHAR(${invoices.issueDate}, ${dateTrunc})`,
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
			.groupBy(sql`TO_CHAR(${invoices.issueDate}, ${dateTrunc})`)
			.orderBy(sql`TO_CHAR(${invoices.issueDate}, ${dateTrunc})`);

		return {
			totalRevenue: toMoneyValue(totalRevenue),
			monthlyRevenue:
				period === "monthly"
					? toMoneyValue(periodRevenue)
					: toMoneyValue(Money.zero(cur)),
			quarterlyRevenue:
				period === "quarterly"
					? toMoneyValue(periodRevenue)
					: toMoneyValue(Money.zero(cur)),
			yearlyRevenue:
				period === "yearly"
					? toMoneyValue(periodRevenue)
					: toMoneyValue(Money.zero(cur)),
			revenueGrowth,
			revenueByMonth: byPeriodResults.map((r) => ({
				month: r.period,
				revenue: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
			})),
		};
	}

	static async getExpenseKPIs(
		companyId: string,
		currency: string = "PEN",
	): Promise<ExpenseKPIs> {
		const cur = currency as "PEN" | "USD";
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const totalResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
				),
			);

		const totalExpenses = Money.fromAmount(
			Number(totalResult[0]?.total || "0"),
			cur,
		);

		const monthlyResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
					gte(invoices.issueDate, monthStart),
					lte(invoices.issueDate, monthEnd),
				),
			);

		const monthlyExpenses = Money.fromAmount(
			Number(monthlyResult[0]?.total || "0"),
			cur,
		);

		const trendResults = await db
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

		return {
			totalExpenses: toMoneyValue(totalExpenses),
			monthlyExpenses: toMoneyValue(monthlyExpenses),
			expensesByCategory: [],
			expenseTrend: trendResults.map((r) => ({
				month: r.month,
				amount: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
			})),
		};
	}

	static async getProfitKPIs(
		companyId: string,
		currency: string = "PEN",
	): Promise<ProfitKPIs> {
		const cur = currency as "PEN" | "USD";
		const now = new Date();

		const totalResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
				),
			);

		const totalRevenue = Money.fromAmount(
			Number(totalResult[0]?.total || "0"),
			cur,
		);
		const profitMargin = totalRevenue.isZero() ? 0 : 100;

		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

		const [currentResult, prevResult] = await Promise.all([
			db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						eq(invoices.status, "PAID"),
						eq(invoices.currency, cur),
						gte(invoices.issueDate, monthStart),
						lte(invoices.issueDate, monthEnd),
					),
				),
			db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						eq(invoices.status, "PAID"),
						eq(invoices.currency, cur),
						gte(invoices.issueDate, prevMonthStart),
						lte(invoices.issueDate, prevMonthEnd),
					),
				),
		]);

		const currentProfit = Money.fromAmount(
			Number(currentResult[0]?.total || "0"),
			cur,
		);
		const prevProfit = Money.fromAmount(
			Number(prevResult[0]?.total || "0"),
			cur,
		);
		const growth = prevProfit.isZero()
			? 0
			: ((currentProfit.toNumber() - prevProfit.toNumber()) /
					prevProfit.toNumber()) *
				100;

		const trendResults = await db
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

		return {
			grossProfit: toMoneyValue(currentProfit),
			netProfit: toMoneyValue(currentProfit),
			profitMargin,
			profitTrend: trendResults.map((r) => ({
				month: r.month,
				profit: toMoneyValue(Money.fromAmount(Number(r.total || "0"), cur)),
			})),
			monthOverMonthGrowth: growth,
		};
	}

	static async getLiquidityKPIs(
		companyId: string,
		currency: string = "PEN",
	): Promise<LiquidityKPIs> {
		const cur = currency as "PEN" | "USD";

		const [paidResult, receivableResult] = await Promise.all([
			db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						eq(invoices.status, "PAID"),
						eq(invoices.currency, cur),
					),
				),
			db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						sql`${invoices.status} IN ('SENT', 'OVERDUE')`,
						eq(invoices.currency, cur),
					),
				),
		]);

		const cash = Money.fromAmount(Number(paidResult[0]?.total || "0"), cur);
		const ar = Money.fromAmount(Number(receivableResult[0]?.total || "0"), cur);
		const ap = Money.zero(cur);
		const totalAssets = cash.add(ar);
		const totalLiabilities = ap;

		const currentRatio = totalLiabilities.isZero()
			? totalAssets.isZero()
				? 1
				: 999
			: totalAssets.toNumber() / totalLiabilities.toNumber();

		return {
			currentRatio,
			quickRatio: currentRatio,
			cashAndEquivalents: toMoneyValue(cash),
			accountsReceivable: toMoneyValue(ar),
			accountsPayable: toMoneyValue(ap),
		};
	}
}
