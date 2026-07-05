import { db } from '@drenyra/persistence/client';
import { and, desc, eq, gte, lte, sql } from '@drenyra/persistence/query';
import { customers, invoices } from '@drenyra/persistence/schema';

/**
 * IncomeAnalyticsService class.
 *
 * @example
 * ```ts
 * const value = new IncomeAnalyticsService();
 * console.log(value);
 * ```
 */
export class IncomeAnalyticsService {
  /** Income KPIs and billing evolution */
  static async getIncome(companyId: string, startDate?: Date, endDate?: Date) {
    const now = new Date();
    const start = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Totals by status
    const totals = await db
      .select({
        totalBilled: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
        totalIgv: sql<string>`COALESCE(SUM(CAST(${invoices.igvAmount} AS DECIMAL)), 0)`,
        count: sql<number>`COUNT(*)`,
        collected: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'PAID' THEN CAST(${invoices.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
        pending: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'SENT' THEN CAST(${invoices.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
        overdue: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'OVERDUE' THEN CAST(${invoices.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
        paidCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'PAID')`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          gte(invoices.issueDate, start),
          lte(invoices.issueDate, end)
        )
      );

    const row = totals[0] ?? { totalBilled: '0', totalIgv: '0', count: 0, collected: '0', pending: '0', overdue: '0', paidCount: 0 };
    const collectionRate = row.count > 0 ? Math.round((row.paidCount / row.count) * 10000) / 100 : 0;

    // Billing evolution (last 12 months)
    const billingEvolution = await db
      .select({
        month: sql<string>`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
        monthLabel: sql<string>`TO_CHAR(${invoices.issueDate}, 'Mon')`,
        total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
        igv: sql<string>`COALESCE(SUM(CAST(${invoices.igvAmount} AS DECIMAL)), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          gte(invoices.issueDate, new Date(now.getFullYear(), now.getMonth() - 11, 1))
        )
      )
      .groupBy(
        sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
        sql`TO_CHAR(${invoices.issueDate}, 'Mon')`
      )
      .orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`);

    // Top customers this period
    const topCustomers = await db
      .select({
        customerId: invoices.customerId,
        customerName: customers.legalName,
        total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(
          eq(invoices.companyId, companyId),
          gte(invoices.issueDate, start),
          lte(invoices.issueDate, end)
        )
      )
      .groupBy(invoices.customerId, customers.legalName)
      .orderBy(desc(sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`))
      .limit(10);

    return {
      totalBilled: parseFloat(row.totalBilled),
      totalIgv: parseFloat(row.totalIgv),
      collected: parseFloat(row.collected),
      pending: parseFloat(row.pending),
      overdue: parseFloat(row.overdue),
      invoiceCount: row.count,
      collectionRate,
      currency: 'PEN' as const,
      billingEvolution: billingEvolution.map(e => ({
        month: e.month,
        label: e.monthLabel,
        total: parseFloat(e.total),
        igv: parseFloat(e.igv),
        count: e.count,
      })),
      topCustomers: topCustomers.map(c => ({
        customerId: c.customerId,
        customerName: c.customerName ?? 'Desconocido',
        total: parseFloat(c.total),
        invoiceCount: c.count,
      })),
    };
  }
}
