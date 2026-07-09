import { Money } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, sql } from "@drenyra/persistence/query";
import { businessPartners, invoices } from "@drenyra/persistence/schema";
import type { ClientSummaryKPIs } from "../cfo-analytics.types";
import { toMoneyValue } from "../cfo-analytics.types";

export class ClientAnalyticsService {
	static async getClientSummary(
		companyId: string,
		currency: string = "PEN",
	): Promise<ClientSummaryKPIs> {
		const cur = currency as "PEN" | "USD";
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const totalPartnersResult = await db
			.select({ total: sql<number>`COUNT(*)` })
			.from(businessPartners)
			.where(eq(businessPartners.companyId, companyId));

		const activeInvoices = await db
			.select({
				customerId: invoices.customerId,
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				count: sql<number>`COUNT(*)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					eq(invoices.currency, cur),
				),
			)
			.groupBy(invoices.customerId)
			.orderBy(sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL)) DESC`)
			.limit(10);

		const newInvoicesResult = await db
			.select({ total: sql<number>`COUNT(*)` })
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					gte(invoices.issueDate, monthStart),
				),
			);

		const totalClients = totalPartnersResult[0]?.total || 0;
		const newClients = newInvoicesResult[0]?.total || 0;

		const clientProfitability = await Promise.all(
			activeInvoices.map(async (row) => {
				const revenue = Money.fromAmount(Number(row.total || "0"), cur);
				return {
					clientId: row.customerId,
					clientName: row.customerId,
					revenue: toMoneyValue(revenue),
					expenses: toMoneyValue(Money.zero(cur)),
					profit: toMoneyValue(revenue),
					margin: 100,
				};
			}),
		);

		return {
			activeClients: activeInvoices.length,
			newClients,
			churnedClients: 0,
			totalClients,
			clientProfitability,
		};
	}
}
