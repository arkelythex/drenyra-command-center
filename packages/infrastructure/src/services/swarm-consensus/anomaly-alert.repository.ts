import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@arkelythex/persistence/client";
import { anomalyAlerts } from "@arkelythex/persistence/schema";
import type { AlertSeverity, FalsePositiveStats } from "./types";

/**
 * anomalyAlertRepository const.
 *
 * @example
 * ```ts
 * console.log(anomalyAlertRepository);
 * ```
 */
export const anomalyAlertRepository = {
	async create(data: {
		organizationId: number;
		entityType: string;
		entityId: string;
		alertType: string;
		severity: AlertSeverity;
		detectorAgentId: string;
		detectorConfidence: string;
		lectorConfidence?: string;
		lectorReasoning?: string;
		validadorConfidence?: string;
		validadorReasoning?: string;
		swarmConsensusThreshold: string;
		swarmConsensusScore?: string;
		alertReasoning: string;
		alertContext?: Record<string, unknown>;
	}) {
		const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		const [alert] = await db
			.insert(anomalyAlerts)
			.values({ id, ...data })
			.returning();
		return alert;
	},

	async findById(id: string) {
		return db
			.select()
			.from(anomalyAlerts)
			.where(eq(anomalyAlerts.id, id))
			.limit(1);
	},

	async findByOrganization(
		organizationId: number,
		options?: { limit?: number; status?: string },
	) {
		const conditions = [eq(anomalyAlerts.organizationId, organizationId)];
		if (options?.status) {
			conditions.push(
				eq(
					anomalyAlerts.status,
					options.status as
						| "pending"
						| "confirmed"
						| "false_positive"
						| "resolved",
				),
			);
		}
		return db
			.select()
			.from(anomalyAlerts)
			.where(and(...conditions))
			.orderBy(desc(anomalyAlerts.createdAt))
			.limit(options?.limit ?? 50);
	},

	async getRecentBySeverity(
		organizationId: number,
		severity: AlertSeverity,
		days: number = 7,
	) {
		return db
			.select({
				status: anomalyAlerts.status,
				severity: anomalyAlerts.severity,
				threshold: anomalyAlerts.swarmConsensusThreshold,
			})
			.from(anomalyAlerts)
			.where(
				and(
					eq(anomalyAlerts.organizationId, organizationId),
					eq(anomalyAlerts.severity, severity),
					sql`${anomalyAlerts.createdAt} > NOW() - INTERVAL '${days} days'`,
				),
			)
			.limit(50);
	},

	async markAsFalsePositive(id: string, reason: string, resolvedBy: string) {
		await db
			.update(anomalyAlerts)
			.set({
				isFalsePositive: true,
				falsePositiveReason: reason,
				status: "false_positive",
				resolvedBy,
				resolvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(anomalyAlerts.id, id));
	},

	async markAsConfirmed(id: string, resolvedBy: string) {
		await db
			.update(anomalyAlerts)
			.set({
				status: "confirmed",
				resolvedBy,
				resolvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(anomalyAlerts.id, id));
	},

	async markAsResolved(id: string, resolvedBy: string) {
		await db
			.update(anomalyAlerts)
			.set({
				status: "resolved",
				resolvedBy,
				resolvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(anomalyAlerts.id, id));
	},

	/**
	 * Compute historical false positive rate for dynamic threshold calibration.
	 *
	 * Uses a JS Date cutoff (not raw SQL INTERVAL) to avoid SQL injection risk
	 * and be compatible with all Drizzle adapters.
	 *
	 * Rate = 0 when total === 0 (no history → no threshold adjustment).
	 */
	async getFalsePositiveRate(
		organizationId: number,
		severity: AlertSeverity,
		days: number = 30,
	): Promise<FalsePositiveStats> {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);

		const rows = await db
			.select({
				total: sql<number>`count(*)::int`,
				falsePositives: sql<number>`sum(case when ${anomalyAlerts.isFalsePositive} then 1 else 0 end)::int`,
			})
			.from(anomalyAlerts)
			.where(
				and(
					eq(anomalyAlerts.organizationId, organizationId),
					eq(anomalyAlerts.severity, severity),
					gte(anomalyAlerts.createdAt, cutoff),
				),
			);

		const total = rows[0]?.total ?? 0;
		const falsePositives = rows[0]?.falsePositives ?? 0;

		return {
			total,
			falsePositives,
			rate: total > 0 ? falsePositives / total : 0,
			lookbackDays: days,
		};
	},
};
