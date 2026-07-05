/**
 * Inter-Company Transaction Repository — ADAPTER (Drizzle ORM)
 *
 * Implements IInterCompanyTransactionRepository using Drizzle + PostgreSQL.
 * All infrastructure concerns live here: queries, joins, pagination, transactions.
 */

import { db } from '@drenyra/persistence/client';
import { and, asc, desc, eq, gte, lte, sql } from '@drenyra/persistence/query';
import { inArray } from 'drizzle-orm';
import {
  companies,
  interCompanyTransactions,
  transactions,
} from '@drenyra/persistence/schema';
import type { IInterCompanyTransactionRepository } from '../domain/inter-company-transaction.repository';
import type {
  AtomicCreateInput,
  AuditPage,
  CreateInterCompanyTransactionResult,
  InterCompanyDetractionAuditFilters,
  InterCompanyTransactionEnriched,
  InterCompanyTransactionRow,
} from '../domain/inter-company-transaction.entity';

const SORT_COLUMN_MAP = {
  createdAt: interCompanyTransactions.createdAt,
  amount: interCompanyTransactions.amount,
  igvAmount: interCompanyTransactions.igvAmount,
  detractionAmount: interCompanyTransactions.detractionAmount,
} as const;

class InterCompanyTransactionRepository implements IInterCompanyTransactionRepository {
  private async enrichWithCompanyMetadata(
    rows: InterCompanyTransactionRow[]
  ): Promise<InterCompanyTransactionEnriched[]> {
    if (rows.length === 0) return [];

    const ids = Array.from(new Set(rows.flatMap((r) => [r.fromCompanyId, r.toCompanyId])));
    const companyRows = await db.query.companies.findMany({ where: inArray(companies.id, ids) });
    const byId = new Map(companyRows.map((c) => [c.id, c]));

    return rows.map((row) => ({
      ...row,
      fromCompanyName: byId.get(row.fromCompanyId)?.businessName ?? 'Unknown',
      fromCompanyRuc: byId.get(row.fromCompanyId)?.ruc ?? '',
      toCompanyName: byId.get(row.toCompanyId)?.businessName ?? 'Unknown',
      toCompanyRuc: byId.get(row.toCompanyId)?.ruc ?? '',
    }));
  }

  async validateSameGroup(
    fromCompanyId: string,
    toCompanyId: string,
    economicGroupId: string
  ): Promise<void> {
    const [from, to] = await Promise.all([
      db.query.companies.findFirst({ where: eq(companies.id, fromCompanyId) }),
      db.query.companies.findFirst({ where: eq(companies.id, toCompanyId) }),
    ]);

    if (!from || !to) throw new Error('Company not found');
    if (
      from.economicGroupId !== economicGroupId ||
      to.economicGroupId !== economicGroupId
    ) {
      throw new Error('Companies must belong to same Economic Group');
    }
    if (fromCompanyId === toCompanyId) {
      throw new Error('Cannot create inter-company transaction with same company');
    }
  }

  async createAtomic(input: AtomicCreateInput): Promise<CreateInterCompanyTransactionResult> {
    const { economicGroupId, fromCompanyId, toCompanyId, concept, amount, taxType, calculations, detractionProfile } = input;
    const issueDate = new Date();

    return db.transaction(async (tx) => {
      const [expense] = await tx.insert(transactions).values({
        companyId: fromCompanyId,
        type: 'EXPENSE',
        documentType: 'FACTURA',
        issueDate,
        subtotal: calculations.subtotal.toFixed(2),
        igvAmount: calculations.igv.toFixed(2),
        totalAmount: calculations.total.toFixed(2),
        isDetraction: calculations.hasDetraction,
        detractionAmount: calculations.detraction?.toFixed(2) ?? null,
        status: 'ACCEPTED',
        notes: `Inter-company: ${concept}`,
        tags: calculations.hasDetraction ? { detractionProfile } : null,
        currency: 'PEN',
      }).returning();

      const [income] = await tx.insert(transactions).values({
        companyId: toCompanyId,
        type: 'INCOME',
        documentType: 'FACTURA',
        issueDate,
        subtotal: calculations.subtotal.toFixed(2),
        igvAmount: calculations.igv.toFixed(2),
        totalAmount: calculations.total.toFixed(2),
        isDetraction: calculations.hasDetraction,
        detractionAmount: calculations.detraction?.toFixed(2) ?? null,
        status: 'ACCEPTED',
        notes: `Inter-company: ${concept}`,
        tags: calculations.hasDetraction ? { detractionProfile } : null,
        currency: 'PEN',
      }).returning();

      const [link] = await tx.insert(interCompanyTransactions).values({
        economicGroupId,
        fromCompanyId,
        fromTransactionId: expense.id,
        toCompanyId,
        toTransactionId: income.id,
        concept,
        amount: amount.toFixed(2),
        taxType,
        igvAmount: calculations.igv.toFixed(2),
        detractionAmount: calculations.detraction?.toFixed(2) ?? null,
        detractionRate: calculations.detractionRate?.toFixed(2) ?? null,
        detractionProfile: calculations.detractionProfile,
        detractionRuleCode: calculations.detractionRuleCode,
        status: 'RECONCILED',
        reconciledAt: new Date(),
      }).returning();

      return { interCompany: link, expense, income, calculations };
    }) as Promise<CreateInterCompanyTransactionResult>;
  }

  async findManyByGroup(economicGroupId: string): Promise<InterCompanyTransactionEnriched[]> {
    const rows = await db.query.interCompanyTransactions.findMany({
      where: eq(interCompanyTransactions.economicGroupId, economicGroupId),
    });
    return this.enrichWithCompanyMetadata(rows as unknown as InterCompanyTransactionRow[]);
  }

  async findAuditPage(filters: InterCompanyDetractionAuditFilters): Promise<AuditPage> {
    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
    const offset = Math.max(filters.offset ?? 0, 0);
    const sortColumn = SORT_COLUMN_MAP[filters.sortBy ?? 'createdAt'];
    const direction = filters.sortDir === 'asc' ? asc : desc;
    const orderBy = [
      direction(sortColumn),
      direction(interCompanyTransactions.createdAt),
      direction(interCompanyTransactions.id),
    ];

    const conditions = [eq(interCompanyTransactions.economicGroupId, filters.economicGroupId)];
    if (filters.detractionProfile) {
      conditions.push(eq(interCompanyTransactions.detractionProfile, filters.detractionProfile));
    }
    if (filters.detractionRuleCode) {
      conditions.push(eq(interCompanyTransactions.detractionRuleCode, filters.detractionRuleCode));
    }
    if (filters.dateFrom) conditions.push(gte(interCompanyTransactions.createdAt, filters.dateFrom));
    if (filters.dateTo) conditions.push(lte(interCompanyTransactions.createdAt, filters.dateTo));

    const where = and(...conditions);
    const [rows, countRows] = await Promise.all([
      db.query.interCompanyTransactions.findMany({ where, orderBy, limit, offset }),
      db.select({ total: sql<number>`count(*)::int` }).from(interCompanyTransactions).where(where),
    ]);

    const items = await this.enrichWithCompanyMetadata(rows as unknown as InterCompanyTransactionRow[]);
    const total = Number(countRows[0]?.total ?? 0);

    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async findById(id: string): Promise<InterCompanyTransactionRow | undefined> {
    const row = await db.query.interCompanyTransactions.findFirst({
      where: eq(interCompanyTransactions.id, id),
    });
    return row as unknown as InterCompanyTransactionRow | undefined;
  }

  async updateSpotPdf(id: string, url: string, referenceNumber: string): Promise<void> {
    await db
      .update(interCompanyTransactions)
      .set({ spotPdfUrl: url, spotReferenceNumber: referenceNumber })
      .where(eq(interCompanyTransactions.id, id));
  }
}

/**
 *  Singleton repository instance — injected into all handlers at startup
 * @example
 * ```ts
 * console.log(interCompanyTransactionRepository);
 * ```
 */

export const interCompanyTransactionRepository = new InterCompanyTransactionRepository();
