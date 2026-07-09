import { Election } from "@drenyra/domain-civic";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { elections } from "../schema/civic.schema";

function toDomain(row) {
	return Election.create({
		id: row.id,
		name: row.name,
		date: row.date,
		region: row.region,
		status: row.status,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	});
}
function toDbInsert(election) {
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
export class PostgresElectionRepository {
	async findById(id) {
		const row = await db
			.select()
			.from(elections)
			.where(eq(elections.id, id))
			.limit(1);
		if (row.length === 0) return null;
		return toDomain(row[0]);
	}
	async findByRegion(region) {
		const rows = await db
			.select()
			.from(elections)
			.where(eq(elections.region, region));
		return rows.map(toDomain);
	}
	async findByStatus(status) {
		const rows = await db
			.select()
			.from(elections)
			.where(eq(elections.status, status));
		return rows.map(toDomain);
	}
	async save(election) {
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
	async delete(id) {
		await db.delete(elections).where(eq(elections.id, id));
	}
}
