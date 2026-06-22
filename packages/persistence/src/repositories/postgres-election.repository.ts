/**
 * PostgresElectionRepository — Drizzle-backed ElectionRepository adapter
 *
 * Maps between Drizzle row types and the Election domain aggregate.
 */

import { eq } from "drizzle-orm";
import type { ElectionRepository } from "@arkelythex/domain-civic";
import { Election, ElectionStatus } from "@arkelythex/domain-civic";
import { db } from "../client";
import { elections } from "../schema/civic.schema";

function toDomain(row: typeof elections.$inferSelect): Election {
	return Election.create({
		id: row.id,
		name: row.name,
		date: row.date,
		region: row.region,
		status: row.status as ElectionStatus,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	});
}

function toDbInsert(election: Election): typeof elections.$inferInsert {
	return {
		id: election.id,
		name: election.name,
		date: election.date,
		region: election.region,
		status: election.status,
		createdAt: election.createdAt,
		updatedAt: election.updatedAt,
	};
}

export class PostgresElectionRepository implements ElectionRepository {
	async findById(id: string): Promise<Election | null> {
		const row = await db
			.select()
			.from(elections)
			.where(eq(elections.id, id))
			.limit(1);

		if (row.length === 0) return null;
		return toDomain(row[0]);
	}

	async findByRegion(region: string): Promise<Election[]> {
		const rows = await db
			.select()
			.from(elections)
			.where(eq(elections.region, region));

		return rows.map(toDomain);
	}

	async findByStatus(status: string): Promise<Election[]> {
		const rows = await db
			.select()
			.from(elections)
			.where(eq(elections.status, status));

		return rows.map(toDomain);
	}

	async save(election: Election): Promise<void> {
		const data = toDbInsert(election);
		await db
			.insert(elections)
			.values(data)
			.onConflictDoUpdate({
				target: elections.id,
				set: {
					name: data.name,
					date: data.date,
					region: data.region,
					status: data.status,
					updatedAt: data.updatedAt,
				},
			});
	}

	async delete(id: string): Promise<void> {
		await db.delete(elections).where(eq(elections.id, id));
	}
}
