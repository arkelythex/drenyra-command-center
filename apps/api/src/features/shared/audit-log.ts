/**
 * Audit Log Service — Business Operations
 *
 * Append-only audit trail for critical fiscal operations.
 * Each entry records WHO did WHAT to WHICH entity, for WHICH company.
 *
 * ## Usage
 *
 * ```ts
 * import { audit } from "../shared/audit-log";
 *
 * await audit.log({
 *   companyId: "uuid",
 *   feature: "accounting-prs",
 *   action: "approve",
 *   targetId: prId,
 *   actorId: userId,
 *   actorLabel: userEmail,
 *   previousValue: "PENDING_REVIEW",
 *   newValue: "APPROVED",
 *   metadata: { comment: "Looks good" },
 * });
 * ```
 *
 * ## Queries
 *
 * ```ts
 * // Recent entries for a company
 * const entries = await audit.forCompany(companyId, { limit: 50 });
 *
 * // Entries for a specific target entity
 * const history = await audit.forTarget(targetId);
 * ```
 *
 * @module features/shared/audit-log
 */
import { db } from "@drenyra/persistence/client";
import { desc, eq } from "@drenyra/persistence/query";
import type { NewAuditLog } from "@drenyra/persistence/schema";
import { auditLogs } from "@drenyra/persistence/schema";
import { createLogger } from "../../lib/logger";

const logger = createLogger({ module: "audit-log" });

export interface AuditLogEntry {
	companyId: string;
	feature: string;
	action: string;
	targetId?: string | null;
	actorId: string;
	actorLabel?: string | null;
	previousValue?: string | null;
	newValue?: string | null;
	metadata?: string | null;
}

/**
 * Audit log service — append-only, tenant-safe.
 */
export const audit = {
	/**
	 * Record a new audit log entry.
	 *
	 * Fail-safe: if the DB write fails, the error is logged but not
	 * propagated — the business operation should not fail because
	 * audit logging is unavailable.
	 */
	async log(entry: AuditLogEntry): Promise<void> {
		try {
			await db.insert(auditLogs).values(entry as NewAuditLog);
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					feature: entry.feature,
					action: entry.action,
					companyId: entry.companyId,
				},
				"Failed to write audit log entry",
			);
		}
	},

	/**
	 * Query recent audit log entries for a company.
	 */
	async forCompany(
		companyId: string,
		options?: { feature?: string; limit?: number },
	): Promise<(typeof auditLogs.$inferSelect)[]> {
		const { feature, limit = 50 } = options ?? {};

		const conditions = [eq(auditLogs.companyId, companyId)];
		if (feature) {
			conditions.push(eq(auditLogs.feature, feature));
		}

		return db
			.select()
			.from(auditLogs)
			.where(eq(auditLogs.companyId, companyId))
			.orderBy(desc(auditLogs.createdAt))
			.limit(limit);
	},

	/**
	 * Query audit history for a specific target entity.
	 */
	async forTarget(
		targetId: string,
		options?: { limit?: number },
	): Promise<(typeof auditLogs.$inferSelect)[]> {
		const { limit = 50 } = options ?? {};

		return db
			.select()
			.from(auditLogs)
			.where(eq(auditLogs.targetId, targetId))
			.orderBy(desc(auditLogs.createdAt))
			.limit(limit);
	},
};
