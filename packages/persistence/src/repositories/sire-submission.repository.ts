/**
 * SIRE Submission Repository
 *
 * Handles persistence of SIRE submissions for audit trail and idempotency.
 *
 * **Wave 3A:** All queries now scope-first — every read/write/delete includes
 * `companyId` filter derived from the authenticated TenantContext.
 *
 * **Key Features:**
 * - Idempotency key tracking (prevent duplicate submissions)
 * - Full audit trail (all attempts, errors, timing)
 * - Rate limiting support (query recent submissions)
 * - Retry mechanism (track failed submissions for retry)
 */

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../client";
import { sireSubmissions } from "../schema";

/**
 * CreateSubmissionInput interface.
 */
export interface CreateSubmissionInput {
	companyId: string;
	period: string;
	ledgerType: "ventas" | "compras";
	payloadFormat: "txt" | "csv" | "json" | "xml";
	idempotencyKey: string;
	provider: "sunat-api" | "simulation";
	dryRun: boolean;
	createdBy?: string;
	warnings?: unknown;
}

/**
 * UpdateSubmissionInput interface.
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
 * Wave 3A: Canonical scope used for all tenant-owned repository methods.
 */
export interface SireScope {
	companyId: string;
}

/**
 * SireSubmissionRepository class.
 *
 * Wave 3A: All tenant-owned methods now require an explicit `SireScope`.
 * Methods that do not need scope (e.g. internal retry queries, admin operations)
 * accept an optional scope parameter and skip filtering when omitted.
 */
export class SireSubmissionRepository {
	/**
	 * Create a new SIRE submission record.
	 * Note: companyId is mandatory and must come from the verified auth context.
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
				status: "PENDING",
				attemptNumber: 1,
				createdBy: input.createdBy,
				warnings: input.warnings,
			})
			.returning();

		return result[0];
	}

	/**
	 * Find submission by idempotency key, scoped by company.
	 *
	 * Wave 3A: Scope-first — companyId filter prevents cross-tenant
	 * idempotency key leak. The caller must always provide scope.
	 *
	 * After migration 0026 (UNIQUE(idempotency_key) → UNIQUE(company_id, idempotency_key)),
	 * different tenants can reuse the same idempotency key without collision.
	 */
	async findByIdempotencyKey(idempotencyKey: string, scope: SireScope) {
		const result = await db
			.select()
			.from(sireSubmissions)
			.where(
				and(
					eq(sireSubmissions.companyId, scope.companyId),
					eq(sireSubmissions.idempotencyKey, idempotencyKey),
				),
			)
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Update submission, scoped by company.
	 * Wave 3A: companyId filter prevents cross-tenant mutation.
	 */
	async update(id: string, input: UpdateSubmissionInput, scope?: SireScope) {
		const conditions = [eq(sireSubmissions.id, id)];
		if (scope) {
			conditions.push(eq(sireSubmissions.companyId, scope.companyId));
		}
		const result = await db
			.update(sireSubmissions)
			.set({
				...input,
				updatedAt: new Date(),
			})
			.where(and(...conditions))
			.returning();

		return result[0];
	}

	/**
	 * Get recent submissions for rate limiting.
	 * Already scoped by companyId implicitly via the companyId parameter.
	 */
	async getRecentSubmissionCount(
		companyId: string,
		windowMinutes: number = 60,
	) {
		const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

		const result = await db
			.select({ count: count() })
			.from(sireSubmissions)
			.where(
				and(
					eq(sireSubmissions.companyId, companyId),
					gte(sireSubmissions.createdAt, windowStart),
				),
			);

		return result[0]?.count || 0;
	}

	/**
	 * Get failed submissions eligible for retry (admin/internal, no tenant scope).
	 */
	async getFailedSubmissionsForRetry(maxAge: Date) {
		return db
			.select()
			.from(sireSubmissions)
			.where(
				and(
					eq(sireSubmissions.status, "FAILED"),
					sql`${sireSubmissions.attemptNumber} < ${sireSubmissions.maxRetries}`,
					gte(sireSubmissions.createdAt, maxAge),
				),
			)
			.orderBy(desc(sireSubmissions.createdAt))
			.limit(50);
	}

	/**
	 * Increment attempt number, scoped by company.
	 */
	async incrementAttempt(id: string, companyId?: string) {
		const conditions = [eq(sireSubmissions.id, id)];
		if (companyId) {
			conditions.push(eq(sireSubmissions.companyId, companyId));
		}
		const result = await db
			.update(sireSubmissions)
			.set({
				attemptNumber: sql`${sireSubmissions.attemptNumber} + 1`,
				updatedAt: new Date(),
			})
			.where(and(...conditions))
			.returning();

		return result[0];
	}

	/**
	 * Get all submissions for a company and period (already scoped).
	 */
	async findByCompanyAndPeriod(companyId: string, period: string) {
		return db
			.select()
			.from(sireSubmissions)
			.where(
				and(
					eq(sireSubmissions.companyId, companyId),
					eq(sireSubmissions.period, period),
				),
			)
			.orderBy(desc(sireSubmissions.createdAt));
	}
}

export const sireSubmissionRepository = new SireSubmissionRepository();
