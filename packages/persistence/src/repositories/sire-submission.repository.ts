/**
 * SIRE Submission Repository
 *
 * Handles persistence of SIRE submissions for audit trail and idempotency.
 *
 * **Key Features:**
 * - Idempotency key tracking (prevent duplicate submissions)
 * - Full audit trail (all attempts, errors, timing)
 * - Rate limiting support (query recent submissions)
 * - Retry mechanism (track failed submissions for retry)
 */

import { db } from '../client';
import { sireSubmissions } from '../schema';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';

/**
 * CreateSubmissionInput interface.
 *
 * @example
 * ```ts
 * const value: CreateSubmissionInput = {} as CreateSubmissionInput;
 * console.log(value);
 * ```
 */
export interface CreateSubmissionInput {
  companyId: string;
  period: string;
  ledgerType: 'ventas' | 'compras';
  payloadFormat: 'txt' | 'csv' | 'json' | 'xml';
  idempotencyKey: string;
  provider: 'sunat-api' | 'simulation';
  dryRun: boolean;
  createdBy?: string;
  warnings?: unknown;
}

/**
 * UpdateSubmissionInput interface.
 *
 * @example
 * ```ts
 * const value: UpdateSubmissionInput = {} as UpdateSubmissionInput;
 * console.log(value);
 * ```
 */
export interface UpdateSubmissionInput {
  status?: string;
  submissionId?: string;
  sunatTicket?: string;
  trackingId?: string;
  sunatStatus?: string;
  sunatCode?: string;
  sunatMessage?: string;
  errors?: unknown;
  warnings?: unknown;
  submittedAt?: Date;
  processedAt?: Date;
  /** Next retry timestamp for exponential backoff on failed submissions */
  nextRetryAt?: Date;
}

/**
 * SireSubmissionRepository class.
 *
 * @example
 * ```ts
 * const value = new SireSubmissionRepository();
 * console.log(value);
 * ```
 */
export class SireSubmissionRepository {
  /**
   * Create a new SIRE submission record
   */
  async create(input: CreateSubmissionInput) {
    const result = await db
      .insert(sireSubmissions)
      .values({
        companyId: input.companyId,
        period: input.period,
        ledgerType: input.ledgerType,
        payloadFormat: input.payloadFormat,
        idempotencyKey: input.idempotencyKey,
        provider: input.provider,
        dryRun: input.dryRun,
        status: 'PENDING',
        attemptNumber: 1,
        createdBy: input.createdBy,
        warnings: input.warnings,
      })
      .returning();

    return result[0];
  }

  /**
   * Find submission by idempotency key
   */
  async findByIdempotencyKey(idempotencyKey: string) {
    const result = await db
      .select()
      .from(sireSubmissions)
      .where(eq(sireSubmissions.idempotencyKey, idempotencyKey))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Update submission (after SUNAT response)
   */
  async update(id: string, input: UpdateSubmissionInput) {
    const result = await db
      .update(sireSubmissions)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(sireSubmissions.id, id))
      .returning();

    return result[0];
  }

  /**
   * Get recent submissions for rate limiting
   */
  async getRecentSubmissionCount(companyId: string, windowMinutes: number = 60) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const result = await db
      .select({ count: count() })
      .from(sireSubmissions)
      .where(
        and(
          eq(sireSubmissions.companyId, companyId),
          gte(sireSubmissions.createdAt, windowStart)
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Get failed submissions eligible for retry
   */
  async getFailedSubmissionsForRetry(maxAge: Date) {
    return db
      .select()
      .from(sireSubmissions)
      .where(
        and(
          eq(sireSubmissions.status, 'FAILED'),
          sql`${sireSubmissions.attemptNumber} < ${sireSubmissions.maxRetries}`,
          gte(sireSubmissions.createdAt, maxAge)
        )
      )
      .orderBy(desc(sireSubmissions.createdAt))
      .limit(50);
  }

  /**
   * Increment attempt number
   */
  async incrementAttempt(id: string) {
    const result = await db
      .update(sireSubmissions)
      .set({
        attemptNumber: sql`${sireSubmissions.attemptNumber} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sireSubmissions.id, id))
      .returning();

    return result[0];
  }

  /**
   * Get all submissions for a company and period
   */
  async findByCompanyAndPeriod(companyId: string, period: string) {
    return db
      .select()
      .from(sireSubmissions)
      .where(
        and(
          eq(sireSubmissions.companyId, companyId),
          eq(sireSubmissions.period, period)
        )
      )
      .orderBy(desc(sireSubmissions.createdAt));
  }
}

/**
 * sireSubmissionRepository const.
 *
 * @example
 * ```ts
 * console.log(sireSubmissionRepository);
 * ```
 */
export const sireSubmissionRepository = new SireSubmissionRepository();
