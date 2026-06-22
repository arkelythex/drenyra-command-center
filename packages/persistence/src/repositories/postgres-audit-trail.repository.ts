/**
 * PostgresAuditTrailRepository — Drizzle-backed AuditTrailRepository adapter
 *
 * Maps between Drizzle row types and the AuditTrail domain entity.
 * Evidence (string[]) and metadata (Record<string, unknown>) are serialized to JSONB.
 */

import { eq } from "drizzle-orm";
import type { AuditTrailRepository } from "@arkelythex/domain-civic";
import { AuditTrail } from "@arkelythex/domain-civic";
import { db } from "../client";
import { auditTrails } from "../schema/civic.schema";

function toDomain(row: typeof auditTrails.$inferSelect): AuditTrail {
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

function toDbInsert(entry: AuditTrail): typeof auditTrails.$inferInsert {
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

export class PostgresAuditTrailRepository implements AuditTrailRepository {
	async findById(id: string): Promise<AuditTrail | null> {
		const rows = await db
			.select()
			.from(auditTrails)
			.where(eq(auditTrails.id, id))
			.limit(1);

		if (rows.length === 0) return null;
		return toDomain(rows[0]);
	}

	async findByAct(actId: string): Promise<AuditTrail[]> {
		const rows = await db
			.select()
			.from(auditTrails)
			.where(eq(auditTrails.actId, actId))
			.orderBy(auditTrails.timestamp);

		return rows.map(toDomain);
	}

	async save(entry: AuditTrail): Promise<void> {
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
