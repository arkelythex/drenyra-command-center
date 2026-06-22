import { db } from '@arkelythex/persistence/client';
import { and, eq, sql } from '@arkelythex/persistence/query';
import { bankAccounts, bankTransactions, invoices } from '@arkelythex/persistence/schema';

/**
 * OverviewService class.
 *
 * @example
 * ```ts
 * const value = new OverviewService();
 * console.log(value);
 * ```
 */
export class OverviewService {
  /** System status with DB latency check */
  static async getSystemStatus() {
    const start = performance.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Math.round(performance.now() - start);

    return {
      status: 'ONLINE' as const,
      version: '2.4.0',
      uptime: Math.round(process.uptime()),
      dbLatency,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  /** Count documents by processing status */
  static async getProcessedDocuments(companyId: string) {
    const result = await db
      .select({
        total: sql<number>`COUNT(*)`,
        processed: sql<number>`COUNT(*) FILTER (WHERE ${invoices.sunatStatus} = 'ACCEPTED')`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${invoices.sunatStatus} IS NULL OR ${invoices.sunatStatus} = 'PENDING')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${invoices.sunatStatus} = 'REJECTED')`,
        draft: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'DRAFT')`,
      })
      .from(invoices)
      .where(eq(invoices.companyId, companyId));

    const row = result[0] ?? { total: 0, processed: 0, pending: 0, rejected: 0, draft: 0 };
    return {
      total: row.total,
      processed: row.processed,
      pending: row.pending,
      rejected: row.rejected,
      draft: row.draft,
      processingRate: row.total > 0 ? Math.round((row.processed / row.total) * 100) : 0,
    };
  }

  /** Monthly cash flow from bank transactions for last N months */
  static async getLiquidity(companyId: string, months = 12) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const accounts = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(eq(bankAccounts.companyId, companyId));

    if (accounts.length === 0) {
      return this.getLiquidityFromInvoices(companyId, months);
    }

    const accountIds = accounts.map(a => a.id);

    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${bankTransactions.transactionDate}, 'YYYY-MM')`,
        cashIn: sql<string>`COALESCE(SUM(CASE WHEN ${bankTransactions.type} = 'CREDIT' THEN CAST(${bankTransactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
        cashOut: sql<string>`COALESCE(SUM(CASE WHEN ${bankTransactions.type} = 'DEBIT' THEN CAST(${bankTransactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
      })
      .from(bankTransactions)
      .where(
        and(
          sql`${bankTransactions.accountId} IN (${sql.join(accountIds.map(id => sql`${id}`), sql`, `)})`,
          sql`${bankTransactions.transactionDate} >= ${startDate.toISOString().split('T')[0]}`
        )
      )
      .groupBy(sql`TO_CHAR(${bankTransactions.transactionDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bankTransactions.transactionDate}, 'YYYY-MM')`);

    let runningBalance = 0;
    return monthlyData.map(row => {
      const cashIn = parseFloat(row.cashIn);
      const cashOut = parseFloat(row.cashOut);
      runningBalance += cashIn - cashOut;
      return {
        month: row.month,
        cashIn,
        cashOut,
        balance: runningBalance,
        projected: runningBalance * 1.05,
      };
    });
  }

  /** Fallback: estimate liquidity from invoices when no bank data */
  private static async getLiquidityFromInvoices(companyId: string, months: number) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'PAID' THEN CAST(${invoices.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
        outstanding: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('SENT', 'OVERDUE') THEN CAST(${invoices.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          sql`${invoices.issueDate} >= ${startDate.toISOString().split('T')[0]}`
        )
      )
      .groupBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`);

    let runningBalance = 0;
    return monthlyData.map(row => {
      const cashIn = parseFloat(row.revenue);
      const cashOut = cashIn * 0.65;
      runningBalance += cashIn - cashOut;
      return {
        month: row.month,
        cashIn,
        cashOut,
        balance: runningBalance,
        projected: runningBalance * 1.05,
      };
    });
  }
}
