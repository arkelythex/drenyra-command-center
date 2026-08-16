import type {
	CloseChecklistItemRecord,
	CloseChecklistRecord,
	CloseChecklistRepository,
	CloseChecklistWithItems,
	CloseDashboard,
	CloseGateRecord,
} from "@drenyra/domain/repositories/close-checklist.repository";
import { db } from "@drenyra/persistence/client";
import {
	closeChecklistItems,
	closeChecklists,
	closeGates,
} from "@drenyra/persistence/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";

const rowToRecord = (
	row: typeof closeChecklists.$inferSelect,
): CloseChecklistRecord => ({
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

const itemRowToRecord = (
	row: typeof closeChecklistItems.$inferSelect,
): CloseChecklistItemRecord => ({
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

const gateRowToRecord = (
	row: typeof closeGates.$inferSelect,
): CloseGateRecord => ({
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

export class PostgresCloseChecklistRepository
	implements CloseChecklistRepository
{
	async save(
		data: Omit<
			CloseChecklistRecord,
			"id" | "createdAt" | "updatedAt" | "progress"
		>,
	): Promise<CloseChecklistRecord> {
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
		if (row === undefined) {
			throw new Error(
				"Failed to persist close checklist: insert returned no row",
			);
		}
		return rowToRecord(row);
	}

	async findById(id: string): Promise<CloseChecklistWithItems | null> {
		const [checklist] = await db
			.select()
			.from(closeChecklists)
			.where(eq(closeChecklists.id, id))
			.limit(1);

		if (!checklist) return null;

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

	async findByCompanyAndPeriod(
		companyId: string,
		period: string,
	): Promise<CloseChecklistRecord[]> {
		const rows = await db
			.select()
			.from(closeChecklists)
			.where(
				and(
					eq(closeChecklists.companyId, companyId),
					eq(closeChecklists.period, period),
				),
			)
			.orderBy(desc(closeChecklists.createdAt));

		return rows.map(rowToRecord);
	}

	async findAllByCompany(companyId: string): Promise<CloseChecklistRecord[]> {
		const rows = await db
			.select()
			.from(closeChecklists)
			.where(eq(closeChecklists.companyId, companyId))
			.orderBy(desc(closeChecklists.createdAt));

		return rows.map(rowToRecord);
	}

	async updateStatus(
		id: string,
		status: CloseChecklistRecord["status"],
	): Promise<CloseChecklistRecord | null> {
		const updateData: Partial<typeof closeChecklists.$inferInsert> = {
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

	async updateProgress(id: string): Promise<number> {
		const items = await db
			.select({
				total: sql<number>`count(*)`,
				done: sql<number>`count(*) filter (where status in ('COMPLETED', 'WAIVED'))`,
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

	async delete(id: string): Promise<void> {
		await db.delete(closeChecklists).where(eq(closeChecklists.id, id));
	}

	async count(companyId: string): Promise<number> {
		const [result] = await db
			.select({ value: sql<number>`count(*)` })
			.from(closeChecklists)
			.where(eq(closeChecklists.companyId, companyId));
		return Number(result?.value ?? 0);
	}

	async saveItem(
		data: Omit<CloseChecklistItemRecord, "id" | "createdAt" | "updatedAt">,
	): Promise<CloseChecklistItemRecord> {
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
		if (row === undefined) {
			throw new Error(
				"Failed to persist close checklist item: insert returned no row",
			);
		}
		return itemRowToRecord(row);
	}

	async updateItem(
		id: string,
		data: Partial<
			Pick<
				CloseChecklistItemRecord,
				"status" | "completedAt" | "completedById" | "notes" | "evidenceIds"
			>
		>,
	): Promise<CloseChecklistItemRecord | null> {
		const [row] = await db
			.update(closeChecklistItems)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(closeChecklistItems.id, id))
			.returning();
		return row ? itemRowToRecord(row) : null;
	}

	async getItemsByChecklistId(
		checklistId: string,
	): Promise<CloseChecklistItemRecord[]> {
		const rows = await db
			.select()
			.from(closeChecklistItems)
			.where(eq(closeChecklistItems.checklistId, checklistId))
			.orderBy(asc(closeChecklistItems.sortOrder));

		return rows.map(itemRowToRecord);
	}

	async saveGate(
		data: Omit<CloseGateRecord, "id" | "createdAt" | "updatedAt">,
	): Promise<CloseGateRecord> {
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
		if (row === undefined) {
			throw new Error(
				"Failed to persist close gate: insert returned no row",
			);
		}
		return gateRowToRecord(row);
	}

	async findGatesByCompanyAndPeriod(
		companyId: string,
		period: string,
	): Promise<CloseGateRecord[]> {
		const rows = await db
			.select()
			.from(closeGates)
			.where(
				and(eq(closeGates.companyId, companyId), eq(closeGates.period, period)),
			)
			.orderBy(asc(closeGates.gateType));

		return rows.map(gateRowToRecord);
	}

	async overrideGate(
		id: string,
		status: CloseGateRecord["status"],
		resolution: string,
		overrideById: string,
	): Promise<CloseGateRecord | null> {
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

	async getDashboard(
		companyId: string,
		period: string,
	): Promise<CloseDashboard> {
		const checklists = await this.findByCompanyAndPeriod(companyId, period);
		const gates = await this.findGatesByCompanyAndPeriod(companyId, period);

		const totalChecklists = checklists.length;
		const completedChecklists = checklists.filter(
			(c) =>
				c.status === "COMPLETED" ||
				c.status === "VERIFIED" ||
				c.status === "LOCKED",
		).length;

		const overallProgress =
			totalChecklists > 0
				? Math.round(
						checklists.reduce((sum, c) => sum + c.progress, 0) /
							totalChecklists,
					)
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
