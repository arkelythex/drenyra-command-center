import { eq } from "drizzle-orm";
import { ElectoralAct } from "@arkelythex/domain-civic";
import { db } from "../client";
import { electoralActs } from "../schema/civic.schema";
function toDomain(row) {
    return ElectoralAct.create({
        id: row.id,
        stationId: row.stationId,
        urnNumber: row.urnNumber,
        voteTallies: new Map(Object.entries(row.voteTallies ?? {})),
        validationStatus: row.validationStatus,
        validatedAt: row.validatedAt ?? undefined,
        validatedBy: row.validatedBy ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    });
}
function toDbInsert(act) {
    return {
        id: act.id,
        stationId: act.stationId,
        urnNumber: act.urnNumber,
        voteTallies: Object.fromEntries(act.voteTallies),
        validationStatus: act.validationStatus,
        validatedAt: act.validatedAt ?? null,
        validatedBy: act.validatedBy ?? null,
        createdAt: act.createdAt,
        updatedAt: act.updatedAt,
    };
}
export class PostgresElectoralActRepository {
    async findById(id) {
        const rows = await db
            .select()
            .from(electoralActs)
            .where(eq(electoralActs.id, id))
            .limit(1);
        if (rows.length === 0)
            return null;
        return toDomain(rows[0]);
    }
    async findByStation(stationId) {
        const rows = await db
            .select()
            .from(electoralActs)
            .where(eq(electoralActs.stationId, stationId));
        return rows.map(toDomain);
    }
    async findByStatus(status) {
        const rows = await db
            .select()
            .from(electoralActs)
            .where(eq(electoralActs.validationStatus, status));
        return rows.map(toDomain);
    }
    async save(act) {
        const data = toDbInsert(act);
        await db
            .insert(electoralActs)
            .values(data)
            .onConflictDoUpdate({
            target: electoralActs.id,
            set: {
                stationId: data.stationId,
                urnNumber: data.urnNumber,
                voteTallies: data.voteTallies,
                validationStatus: data.validationStatus,
                validatedAt: data.validatedAt,
                validatedBy: data.validatedBy,
                updatedAt: data.updatedAt,
            },
        });
    }
}
//# sourceMappingURL=postgres-electoral-act.repository.js.map