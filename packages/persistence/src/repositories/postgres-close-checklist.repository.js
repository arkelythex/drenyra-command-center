import { db } from "@drenyra/persistence/client";
import { closeChecklistItems, closeChecklists, closeGates, } from "@drenyra/persistence/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
const rowToRecord = (row) => ({
    id: row.id,
    companyId: row.companyId,
    period: row.period,
    name: row.name,
    status: row.status,
    assignedToId: row.assignedToId,
    progress: row.progress,
    dueDate: row.dueDate,
    completedAt: row.completedAt,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});
const itemRowToRecord = (row) => ({
    id: row.id,
    checklistId: row.checklistId,
    name: row.name,
    description: row.description,
    category: row.category,
    status: row.status,
    assignedToId: row.assignedToId,
    completedAt: row.completedAt,
    completedById: row.completedById,
    notes: row.notes,
    evidenceIds: row.evidenceIds ?? [],
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});
const gateRowToRecord = (row) => ({
    id: row.id,
    companyId: row.companyId,
    period: row.period,
    gateType: row.gateType,
    status: row.status,
    description: row.description,
    resolution: row.resolution,
    overrideById: row.overrideById,
    overriddenAt: row.overriddenAt,
    readOnly: row.readOnly,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});
export class PostgresCloseChecklistRepository {
    async save(data) {
        const [row] = await db
            .insert(closeChecklists)
            .values({
            companyId: data.companyId,
            period: data.period,
            name: data.name,
            status: data.status,
            assignedToId: data.assignedToId,
            dueDate: data.dueDate,
            completedAt: data.completedAt,
            notes: data.notes,
        })
            .returning();
        return rowToRecord(row);
    }
    async findById(id) {
        const [checklist] = await db
            .select()
            .from(closeChecklists)
            .where(eq(closeChecklists.id, id))
            .limit(1);
        if (!checklist)
            return null;
        const items = await db
            .select()
            .from(closeChecklistItems)
            .where(eq(closeChecklistItems.checklistId, id))
            .orderBy(asc(closeChecklistItems.sortOrder));
        return {
            ...rowToRecord(checklist),
            items: items.map(itemRowToRecord),
        };
    }
    async findByCompanyAndPeriod(companyId, period) {
        const rows = await db
            .select()
            .from(closeChecklists)
            .where(and(eq(closeChecklists.companyId, companyId), eq(closeChecklists.period, period)))
            .orderBy(desc(closeChecklists.createdAt));
        return rows.map(rowToRecord);
    }
    async findAllByCompany(companyId) {
        const rows = await db
            .select()
            .from(closeChecklists)
            .where(eq(closeChecklists.companyId, companyId))
            .orderBy(desc(closeChecklists.createdAt));
        return rows.map(rowToRecord);
    }
    async updateStatus(id, status) {
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (status === "COMPLETED" || status === "LOCKED") {
            updateData.completedAt = new Date();
        }
        const [row] = await db
            .update(closeChecklists)
            .set(updateData)
            .where(eq(closeChecklists.id, id))
            .returning();
        return row ? rowToRecord(row) : null;
    }
    async updateProgress(id) {
        const items = await db
            .select({
            total: sql `count(*)`,
            done: sql `count(*) filter (where status in ('COMPLETED', 'WAIVED'))`,
        })
            .from(closeChecklistItems)
            .where(eq(closeChecklistItems.checklistId, id));
        const total = Number(items[0]?.total ?? 0);
        const done = Number(items[0]?.done ?? 0);
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        await db
            .update(closeChecklists)
            .set({ progress, updatedAt: new Date() })
            .where(eq(closeChecklists.id, id));
        return progress;
    }
    async delete(id) {
        await db.delete(closeChecklists).where(eq(closeChecklists.id, id));
    }
    async count(companyId) {
        const [result] = await db
            .select({ value: sql `count(*)` })
            .from(closeChecklists)
            .where(eq(closeChecklists.companyId, companyId));
        return Number(result?.value ?? 0);
    }
    async saveItem(data) {
        const [row] = await db
            .insert(closeChecklistItems)
            .values({
            checklistId: data.checklistId,
            name: data.name,
            description: data.description,
            category: data.category,
            status: data.status,
            assignedToId: data.assignedToId,
            completedAt: data.completedAt,
            completedById: data.completedById,
            notes: data.notes,
            evidenceIds: data.evidenceIds,
            sortOrder: data.sortOrder,
        })
            .returning();
        return itemRowToRecord(row);
    }
    async updateItem(id, data) {
        const [row] = await db
            .update(closeChecklistItems)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(closeChecklistItems.id, id))
            .returning();
        return row ? itemRowToRecord(row) : null;
    }
    async getItemsByChecklistId(checklistId) {
        const rows = await db
            .select()
            .from(closeChecklistItems)
            .where(eq(closeChecklistItems.checklistId, checklistId))
            .orderBy(asc(closeChecklistItems.sortOrder));
        return rows.map(itemRowToRecord);
    }
    async saveGate(data) {
        const [row] = await db
            .insert(closeGates)
            .values({
            companyId: data.companyId,
            period: data.period,
            gateType: data.gateType,
            status: data.status,
            description: data.description,
            resolution: data.resolution,
            overrideById: data.overrideById,
            overriddenAt: data.overriddenAt,
            readOnly: data.readOnly,
        })
            .returning();
        return gateRowToRecord(row);
    }
    async findGatesByCompanyAndPeriod(companyId, period) {
        const rows = await db
            .select()
            .from(closeGates)
            .where(and(eq(closeGates.companyId, companyId), eq(closeGates.period, period)))
            .orderBy(asc(closeGates.gateType));
        return rows.map(gateRowToRecord);
    }
    async overrideGate(id, status, resolution, overrideById) {
        const [row] = await db
            .update(closeGates)
            .set({
            status,
            resolution,
            overrideById,
            overriddenAt: new Date(),
            updatedAt: new Date(),
        })
            .where(eq(closeGates.id, id))
            .returning();
        return row ? gateRowToRecord(row) : null;
    }
    async getDashboard(companyId, period) {
        const checklists = await this.findByCompanyAndPeriod(companyId, period);
        const gates = await this.findGatesByCompanyAndPeriod(companyId, period);
        const totalChecklists = checklists.length;
        const completedChecklists = checklists.filter((c) => c.status === "COMPLETED" ||
            c.status === "VERIFIED" ||
            c.status === "LOCKED").length;
        const overallProgress = totalChecklists > 0
            ? Math.round(checklists.reduce((sum, c) => sum + c.progress, 0) /
                totalChecklists)
            : 0;
        const overdueItems = 0;
        return {
            period,
            overallProgress,
            totalChecklists,
            completedChecklists,
            overdueItems,
            gates,
        };
    }
}
//# sourceMappingURL=postgres-close-checklist.repository.js.map