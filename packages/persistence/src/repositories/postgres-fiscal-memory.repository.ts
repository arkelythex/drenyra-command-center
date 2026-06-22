import { and, asc, eq, or, sql } from "drizzle-orm";
import { FiscalMemory, FiscalMemoryRevision } from "@arkelythex/domain/fiscal-memory";
import type {
	FiscalMemoryProps,
	FiscalMemoryRevisionProps,
	FiscalMemoryScope,
	FiscalMemoryCategory,
	FiscalMemorySeverity,
} from "@arkelythex/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@arkelythex/domain/repositories/fiscal-memory.repository";
import { db } from "@arkelythex/persistence/client";
import {
	fiscalMemories,
	fiscalMemoryRevisions,
	type FiscalMemoryRevisionRow,
	type FiscalMemoryRow,
} from "@arkelythex/persistence/schema";

const scopedWhere = (scope: FiscalMemoryScope) =>
	and(
		eq(fiscalMemories.tenantId, scope.tenantId),
		eq(fiscalMemories.companyId, scope.companyId),
		eq(fiscalMemories.ruc, scope.ruc),
	);

const toDate = (value: Date | string): Date =>
	value instanceof Date ? value : new Date(value);

const normalizeMemoryProps = (props: FiscalMemoryProps): FiscalMemoryProps => ({
	...props,
	createdAt: toDate(props.createdAt),
	updatedAt: toDate(props.updatedAt),
});

export class PostgresFiscalMemoryRepository implements FiscalMemoryRepository {
	async save(memory: FiscalMemory): Promise<void> {
		const props = memory.toJSON();
		await db
			.insert(fiscalMemories)
			.values({
				id: props.id,
				tenantId: props.tenantId,
				companyId: props.companyId,
				ruc: props.ruc,
				period: props.period,
				category: props.category,
				severity: props.severity,
				status: props.status,
				title: props.title,
				summary: props.summary,
				evidenceRefs: props.evidenceRefs,
				tags: props.tags,
				createdBy: props.createdBy,
				approvedBy: props.approvedBy ?? null,
				sourceAgentId: props.sourceAgentId ?? null,
				relatedMemoryIds: props.relatedMemoryIds ?? [],
				createdAt: props.createdAt,
				updatedAt: props.updatedAt,
			})
			.onConflictDoUpdate({
				target: fiscalMemories.id,
				set: {
					severity: props.severity,
					status: props.status,
					title: props.title,
					summary: props.summary,
					evidenceRefs: props.evidenceRefs,
					tags: props.tags,
					approvedBy: props.approvedBy ?? null,
					sourceAgentId: props.sourceAgentId ?? null,
					relatedMemoryIds: props.relatedMemoryIds ?? [],
					updatedAt: props.updatedAt,
				},
			});
	}

	async findById(id: string, scope: FiscalMemoryScope): Promise<FiscalMemory | null> {
		const [row] = await db
			.select()
			.from(fiscalMemories)
			.where(and(eq(fiscalMemories.id, id), scopedWhere(scope)))
			.limit(1);
		return row ? this.toDomain(row) : null;
	}

	async findByPeriod(scope: FiscalMemoryScope, period: string): Promise<FiscalMemory[]> {
		return this.findMany(and(scopedWhere(scope), eq(fiscalMemories.period, period)));
	}

	async findByCategory(
		scope: FiscalMemoryScope,
		category: FiscalMemoryCategory,
	): Promise<FiscalMemory[]> {
		return this.findMany(and(scopedWhere(scope), eq(fiscalMemories.category, category)));
	}

	async findBySeverity(
		scope: FiscalMemoryScope,
		severity: FiscalMemorySeverity,
	): Promise<FiscalMemory[]> {
		return this.findMany(and(scopedWhere(scope), eq(fiscalMemories.severity, severity)));
	}

	async findByEvidenceRef(scope: FiscalMemoryScope, evidenceRef: string): Promise<FiscalMemory[]> {
		return this.findMany(
			and(
				scopedWhere(scope),
				// Scope evidence: scopedWhere enforces tenantId, companyId, and ruc before this JSONB predicate.
				sql`${fiscalMemories.evidenceRefs} @> ${JSON.stringify([evidenceRef])}::jsonb`,
			),
		);
	}

	async findRelated(scope: FiscalMemoryScope, memoryId: string): Promise<FiscalMemory[]> {
		return this.findMany(
			and(
				scopedWhere(scope),
				or(
					eq(fiscalMemories.id, memoryId),
					// Scope evidence: scopedWhere enforces tenantId, companyId, and ruc before this JSONB predicate.
					sql`${fiscalMemories.relatedMemoryIds} @> ${JSON.stringify([memoryId])}::jsonb`,
				),
			),
		);
	}

	async saveRevision(revision: FiscalMemoryRevision): Promise<void> {
		const props = revision.toJSON();
		await db.insert(fiscalMemoryRevisions).values({
			id: props.id,
			memoryId: props.memoryId,
			revisionNumber: props.revisionNumber,
			changedBy: props.changedBy,
			changeReason: props.changeReason,
			previousValue: props.previousValue,
			nextValue: props.nextValue,
			createdAt: props.createdAt,
		});
	}

	async findRevisions(memoryId: string): Promise<FiscalMemoryRevision[]> {
		const rows = await db
			.select()
			.from(fiscalMemoryRevisions)
			.where(eq(fiscalMemoryRevisions.memoryId, memoryId))
			.orderBy(asc(fiscalMemoryRevisions.revisionNumber));
		return rows.map((row) => this.toRevisionDomain(row));
	}

	private async findMany(whereClause: ReturnType<typeof and>): Promise<FiscalMemory[]> {
		const rows = await db
			.select()
			.from(fiscalMemories)
			.where(whereClause)
			.orderBy(asc(fiscalMemories.period), asc(fiscalMemories.createdAt));
		return rows.map((row) => this.toDomain(row));
	}

	private toDomain(row: FiscalMemoryRow): FiscalMemory {
		return FiscalMemory.rehydrate({
			id: row.id,
			tenantId: row.tenantId,
			companyId: row.companyId,
			ruc: row.ruc,
			period: row.period,
			category: row.category,
			severity: row.severity,
			status: row.status,
			title: row.title,
			summary: row.summary,
			evidenceRefs: row.evidenceRefs,
			tags: row.tags,
			createdBy: row.createdBy,
			approvedBy: row.approvedBy ?? undefined,
			sourceAgentId: row.sourceAgentId ?? undefined,
			relatedMemoryIds: row.relatedMemoryIds,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		});
	}

	private toRevisionDomain(row: FiscalMemoryRevisionRow): FiscalMemoryRevision {
		const props: FiscalMemoryRevisionProps = {
			id: row.id,
			memoryId: row.memoryId,
			revisionNumber: row.revisionNumber,
			changedBy: row.changedBy,
			changeReason: row.changeReason,
			previousValue: normalizeMemoryProps(row.previousValue),
			nextValue: normalizeMemoryProps(row.nextValue),
			createdAt: row.createdAt,
		};
		return FiscalMemoryRevision.create(props);
	}
}
