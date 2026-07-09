import { db } from "@drenyra/persistence/client";
import { anomalyAlerts } from "@drenyra/persistence/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
export const anomalyAlertRepository = {
	async create(data) {
		const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		const [alert] = await db
			.insert(anomalyAlerts)
			.values({ id, ...data })
			.returning();
		return alert;
	},
	async findById(id) {
		return db
			.select()
			.from(anomalyAlerts)
			.where(eq(anomalyAlerts.id, id))
			.limit(1);
	},
	async findByOrganization(organizationId, options) {
		const conditions = [eq(anomalyAlerts.organizationId, organizationId)];
		if (options?.status) {
			conditions.push(eq(anomalyAlerts.status, options.status));
		}
		return db
			.select()
			.from(anomalyAlerts)
			.where(and(...conditions))
			.orderBy(desc(anomalyAlerts.createdAt))
			.limit(options?.limit ?? 50);
	},
	async getRecentBySeverity(organizationId, severity, days = 7) {
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
	async markAsFalsePositive(id, reason, resolvedBy) {
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
	async markAsConfirmed(id, resolvedBy) {
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
	async markAsResolved(id, resolvedBy) {
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
	async getFalsePositiveRate(organizationId, severity, days = 30) {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);
		const rows = await db
			.select({
				total: sql`count(*)::int`,
				falsePositives: sql`sum(case when ${anomalyAlerts.isFalsePositive} then 1 else 0 end)::int`,
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
