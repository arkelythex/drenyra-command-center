/**
 * PostgresCivicCaseRepository — Drizzle-backed CivicCaseRepository adapter
 *
 * Maps between Drizzle row types and the CivicCase domain aggregate.
 * FraudIndicators are stored as JSONB within the civic_cases row.
 */

import { eq } from "drizzle-orm";
import type { CivicCaseRepository } from "@arkelythex/domain-civic";
import { CivicCase, CivicCaseStatus, FraudIndicator } from "@arkelythex/domain-civic";
import { db } from "../client";
// @ts-expect-error — TODO: civicCases table not yet defined in civic.schema
import { civicCases } from "../schema/civic.schema";

interface FraudIndicatorRow {
	type: string;
	severity: string;
	description: string;
	evidence: string[];
	detectedAt: string;
}

function toDomain(row: typeof civicCases.$inferSelect): CivicCase {
	return CivicCase.create({
		id: row.id,
		name: row.name,
		electionIds: row.electionIds ?? [],
		fraudIndicators: (row.fraudIndicators ?? []).map(
			(f: FraudIndicatorRow) =>
				FraudIndicator.create({
					type: f.type as never,
					severity: f.severity as never,
					description: f.description,
					evidence: f.evidence,
					detectedAt: new Date(f.detectedAt),
				}),
		),
		timeline: row.timeline ?? [],
		status: row.status as CivicCaseStatus,
		escalationReason: row.escalationReason ?? undefined,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	});
}

function toDbInsert(civicCase: CivicCase): typeof civicCases.$inferInsert {
	return {
		id: civicCase.id,
		name: civicCase.name,
		electionIds: [...civicCase.electionIds] as string[],
		fraudIndicators: civicCase.fraudIndicators.map(
			(f) => f.toJSON() as unknown as FraudIndicatorRow,
		),
		timeline: [...civicCase.timeline] as string[],
		status: civicCase.status,
		escalationReason: civicCase.escalationReason,
		createdAt: civicCase.createdAt,
		updatedAt: civicCase.updatedAt,
	};
}

export class PostgresCivicCaseRepository implements CivicCaseRepository {
	async findById(id: string): Promise<CivicCase | null> {
		const rows = await db
			.select()
			.from(civicCases)
			.where(eq(civicCases.id, id))
			.limit(1);

		if (rows.length === 0) return null;
		return toDomain(rows[0]);
	}

	async findByStatus(status: string): Promise<CivicCase[]> {
		const rows = await db
			.select()
			.from(civicCases)
			.where(eq(civicCases.status, status));

		return rows.map(toDomain);
	}

	async save(civicCase: CivicCase): Promise<void> {
		const data = toDbInsert(civicCase);
		await db
			.insert(civicCases)
			.values(data)
			.onConflictDoUpdate({
				target: civicCases.id,
				set: {
					name: data.name,
					electionIds: data.electionIds,
					fraudIndicators: data.fraudIndicators,
					timeline: data.timeline,
					status: data.status,
					escalationReason: data.escalationReason,
					updatedAt: data.updatedAt,
				},
			});
	}

	async delete(id: string): Promise<void> {
		await db.delete(civicCases).where(eq(civicCases.id, id));
	}
}
