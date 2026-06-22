/**
 * PostgresFraudIndicatorRepository — Drizzle-backed FraudIndicatorRepository adapter
 *
 * Maps between Drizzle row types and the FraudIndicator domain value object.
 * Since FraudIndicator is a value object (no id/electionId), the repository
 * manages persistence metadata (id, electionId, actId) at the storage layer.
 */

import { eq } from "drizzle-orm";
import type { FraudIndicatorRepository } from "@arkelythex/domain-civic";
import {
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "@arkelythex/domain-civic";
import { db } from "../client";
import { fraudIndicators } from "../schema/civic.schema";

/** Persistence-level row type that includes storage metadata */
type PersistedIndicator = typeof fraudIndicators.$inferSelect;

function toDomain(row: PersistedIndicator): FraudIndicator {
	return FraudIndicator.create({
		type: row.type as FraudIndicatorType,
		severity: row.severity as FraudSeverity,
		description: row.description,
		evidence: row.evidence ?? [],
		detectedAt: row.detectedAt,
	});
}

export class PostgresFraudIndicatorRepository
	implements FraudIndicatorRepository
{
	async findById(id: string): Promise<FraudIndicator | null> {
		const rows = await db
			.select()
			.from(fraudIndicators)
			.where(eq(fraudIndicators.id, id))
			.limit(1);

		if (rows.length === 0) return null;
		return toDomain(rows[0]);
	}

	async findByElection(electionId: string): Promise<FraudIndicator[]> {
		const rows = await db
			.select()
			.from(fraudIndicators)
			.where(eq(fraudIndicators.electionId, electionId));

		return rows.map(toDomain);
	}

	async findBySeverity(severity: string): Promise<FraudIndicator[]> {
		const rows = await db
			.select()
			.from(fraudIndicators)
			.where(eq(fraudIndicators.severity, severity));

		return rows.map(toDomain);
	}

	async save(indicator: FraudIndicator): Promise<void> {
		await db.insert(fraudIndicators).values({
			type: indicator.type,
			severity: indicator.severity,
			description: indicator.description,
			evidence: [...indicator.evidence],
			detectedAt: indicator.detectedAt,
		});
	}
}
