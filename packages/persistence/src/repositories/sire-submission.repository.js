import { db } from '../client';
import { sireSubmissions } from '../schema';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';
export class SireSubmissionRepository {
    async create(input) {
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
    async findByIdempotencyKey(idempotencyKey) {
        const result = await db
            .select()
            .from(sireSubmissions)
            .where(eq(sireSubmissions.idempotencyKey, idempotencyKey))
            .limit(1);
        return result[0] || null;
    }
    async update(id, input) {
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
    async getRecentSubmissionCount(companyId, windowMinutes = 60) {
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
        const result = await db
            .select({ count: count() })
            .from(sireSubmissions)
            .where(and(eq(sireSubmissions.companyId, companyId), gte(sireSubmissions.createdAt, windowStart)));
        return result[0]?.count || 0;
    }
    async getFailedSubmissionsForRetry(maxAge) {
        return db
            .select()
            .from(sireSubmissions)
            .where(and(eq(sireSubmissions.status, 'FAILED'), sql `${sireSubmissions.attemptNumber} < ${sireSubmissions.maxRetries}`, gte(sireSubmissions.createdAt, maxAge)))
            .orderBy(desc(sireSubmissions.createdAt))
            .limit(50);
    }
    async incrementAttempt(id) {
        const result = await db
            .update(sireSubmissions)
            .set({
            attemptNumber: sql `${sireSubmissions.attemptNumber} + 1`,
            updatedAt: new Date(),
        })
            .where(eq(sireSubmissions.id, id))
            .returning();
        return result[0];
    }
    async findByCompanyAndPeriod(companyId, period) {
        return db
            .select()
            .from(sireSubmissions)
            .where(and(eq(sireSubmissions.companyId, companyId), eq(sireSubmissions.period, period)))
            .orderBy(desc(sireSubmissions.createdAt));
    }
}
export const sireSubmissionRepository = new SireSubmissionRepository();
//# sourceMappingURL=sire-submission.repository.js.map