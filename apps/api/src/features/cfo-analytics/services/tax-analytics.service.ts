import { Money } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";
import type { TaxKPISummary } from "../cfo-analytics.types";
import { toMoneyValue } from "../cfo-analytics.types";

const IGV_RATE = 0.18;

export class TaxAnalyticsService {
	static async getComplianceScore(
		companyId: string,
		currency: string = "PEN",
	): Promise<number> {
		const cur = currency as "PEN" | "USD";

		const [totalCount, rejectedCount] = await Promise.all([
			db
				.select({ count: sql<number>`COUNT(*)` })
				.from(invoices)
				.where(
					and(eq(invoices.companyId, companyId), eq(invoices.currency, cur)),
				),
			db
				.select({ count: sql<number>`COUNT(*)` })
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						sql`${invoices.status} IN ('REJECTED', 'CANCELLED')`,
						eq(invoices.currency, cur),
					),
				),
		]);

		const total = totalCount[0]?.count || 0;
		const rejected = rejectedCount[0]?.count || 0;

		if (total === 0) return 100;

		const rejectionRate = rejected / total;
		const score = Math.round((1 - rejectionRate) * 100);

		return Math.max(0, Math.min(100, score));
	}

	static async getUpcomingDeadlines(
		_companyId: string,
	): Promise<TaxKPISummary["upcomingDeadlines"]> {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1;

		const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
		const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

		return [
			{
				concept: `SIRE - PDT ${String(nextMonth).padStart(2, "0")}/${nextMonthYear}`,
				dueDate: `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-10`,
				amount: toMoneyValue(Money.zero("PEN")),
				status: "pending",
			},
			{
				concept: `IGV Declaración Mensual - ${String(currentMonth).padStart(2, "0")}/${currentYear}`,
				dueDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-15`,
				amount: toMoneyValue(Money.zero("PEN")),
				status: "pending",
			},
			{
				concept: `Detracciones SPOT - ${String(currentMonth).padStart(2, "0")}/${currentYear}`,
				dueDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-20`,
				amount: toMoneyValue(Money.zero("PEN")),
				status: "pending",
			},
		];
	}

	static async getTaxLiabilityProjection(
		companyId: string,
		currency: string = "PEN",
	): Promise<TaxKPISummary> {
		const cur = currency as "PEN" | "USD";
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const [monthlyResult, totalResult] = await Promise.all([
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
					),
				),
		]);

		const monthlyRevenue = Money.fromAmount(
			Number(monthlyResult[0]?.total || "0"),
			cur,
		);
		const totalRevenue = Money.fromAmount(
			Number(totalResult[0]?.total || "0"),
			cur,
		);

		const monthlyIGV = monthlyRevenue.multiply(IGV_RATE);
		const totalTaxLiability = totalRevenue.multiply(IGV_RATE);

		const complianceScore = await TaxAnalyticsService.getComplianceScore(
			companyId,
			currency,
		);
		const deadlines = await TaxAnalyticsService.getUpcomingDeadlines(companyId);

		const complianceByPeriod = [
			{
				period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
				score: complianceScore,
				issues:
					complianceScore < 100
						? ["Algunas facturas rechazadas en el período"]
						: [],
			},
		];

		return {
			complianceScore,
			monthlyIGV: toMoneyValue(monthlyIGV),
			totalTaxLiability: toMoneyValue(totalTaxLiability),
			upcomingDeadlines: deadlines,
			complianceByPeriod,
		};
	}
}
