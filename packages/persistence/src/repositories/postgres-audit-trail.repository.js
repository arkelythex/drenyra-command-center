import { AuditTrail } from "@drenyra/domain-civic";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { auditTrails } from "../schema/civic.schema";

function toDomain(row) {
	return AuditTrail.create({
		id: row.id,
		actId: row.actId,
		action: row.action,
		actor: row.actor,
		timestamp: row.timestamp,
		evidence: row.evidence ?? [],
		metadata: row.metadata ?? {},
		createdAt: row.createdAt,
	});
}
function toDbInsert(entry) {
	return {
		id: entry.id,
		actId: entry.actId,
		action: entry.action,
		actor: entry.actor,
		timestamp: entry.timestamp,
		evidence: [...entry.evidence],
		metadata: { ...entry.metadata },
		createdAt: entry.createdAt,
	};
}
export class PostgresAuditTrailRepository {
	async findById(id) {
		const rows = await db
			.select()
			.from(auditTrails)
			.where(eq(auditTrails.id, id))
			.limit(1);
		if (rows.length === 0) return null;
		return toDomain(rows[0]);
	}
	async findByAct(actId) {
		const rows = await db
			.select()
			.from(auditTrails)
			.where(eq(auditTrails.actId, actId))
			.orderBy(auditTrails.timestamp);
		return rows.map(toDomain);
	}
	async save(entry) {
		const data = toDbInsert(entry);
		await db
			.insert(auditTrails)
			.values(data)
			.onConflictDoUpdate({
				target: auditTrails.id,
				set: {
					evidence: data.evidence,
					metadata: data.metadata,
				},
			});
	}
}
//# sourceMappingURL=postgres-audit-trail.repository.js.map
