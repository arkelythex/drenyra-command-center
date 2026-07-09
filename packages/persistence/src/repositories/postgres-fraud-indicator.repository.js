import { FraudIndicator } from "@drenyra/domain-civic";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { fraudIndicators } from "../schema/civic.schema";

function toDomain(row) {
	return FraudIndicator.create({
		type: row.type,
		severity: row.severity,
		description: row.description,
		evidence: row.evidence ?? [],
		detectedAt: row.detectedAt,
	});
}
export class PostgresFraudIndicatorRepository {
	async findById(id) {
		const rows = await db
			.select()
			.from(fraudIndicators)
			.where(eq(fraudIndicators.id, id))
			.limit(1);
		if (rows.length === 0) return null;
		return toDomain(rows[0]);
	}
	async findByElection(electionId) {
		const rows = await db
			.select()
			.from(fraudIndicators)
			.where(eq(fraudIndicators.electionId, electionId));
		return rows.map(toDomain);
	}
	async findBySeverity(severity) {
		const rows = await db
			.select()
			.from(fraudIndicators)
			.where(eq(fraudIndicators.severity, severity));
		return rows.map(toDomain);
	}
	async save(indicator) {
		await db.insert(fraudIndicators).values({
			type: indicator.type,
			severity: indicator.severity,
			description: indicator.description,
			evidence: [...indicator.evidence],
			detectedAt: indicator.detectedAt,
		});
	}
}

