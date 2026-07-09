import {
	FiscalMemory,
	FiscalMemoryRevision,
} from "@drenyra/domain/fiscal-memory";
import { db } from "@drenyra/persistence/client";
import {
	fiscalMemories,
	fiscalMemoryRevisions,
} from "@drenyra/persistence/schema";
import { and, asc, eq, or, sql } from "drizzle-orm";

const scopedWhere = (scope) =>
	and(
		eq(fiscalMemories.tenantId, scope.tenantId),
		eq(fiscalMemories.companyId, scope.companyId),
		eq(fiscalMemories.ruc, scope.ruc),
	);
const toDate = (value) => (value instanceof Date ? value : new Date(value));
const normalizeMemoryProps = (props) => ({
	...props,
	createdAt: toDate(props.createdAt),
	updatedAt: toDate(props.updatedAt),
});
export class PostgresFiscalMemoryRepository {
	async save(memory) {
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
	async findById(id, scope) {
		const [row] = await db
			.select()
			.from(fiscalMemories)
			.where(and(eq(fiscalMemories.id, id), scopedWhere(scope)))
			.limit(1);
		return row ? this.toDomain(row) : null;
	}
	async findByPeriod(scope, period) {
		return this.findMany(
			and(scopedWhere(scope), eq(fiscalMemories.period, period)),
		);
	}
	async findByCategory(scope, category) {
		return this.findMany(
			and(scopedWhere(scope), eq(fiscalMemories.category, category)),
		);
	}
	async findBySeverity(scope, severity) {
		return this.findMany(
			and(scopedWhere(scope), eq(fiscalMemories.severity, severity)),
		);
	}
	async findByEvidenceRef(scope, evidenceRef) {
		return this.findMany(
			and(
				scopedWhere(scope),
				sql`${fiscalMemories.evidenceRefs} @> ${JSON.stringify([evidenceRef])}::jsonb`,
			),
		);
	}
	async findRelated(scope, memoryId) {
		return this.findMany(
			and(
				scopedWhere(scope),
				or(
					eq(fiscalMemories.id, memoryId),
					sql`${fiscalMemories.relatedMemoryIds} @> ${JSON.stringify([memoryId])}::jsonb`,
				),
			),
		);
	}
	async saveRevision(revision) {
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
	async findRevisions(memoryId) {
		const rows = await db
			.select()
			.from(fiscalMemoryRevisions)
			.where(eq(fiscalMemoryRevisions.memoryId, memoryId))
			.orderBy(asc(fiscalMemoryRevisions.revisionNumber));
		return rows.map((row) => this.toRevisionDomain(row));
	}
	async findMany(whereClause) {
		const rows = await db
			.select()
			.from(fiscalMemories)
			.where(whereClause)
			.orderBy(asc(fiscalMemories.period), asc(fiscalMemories.createdAt));
		return rows.map((row) => this.toDomain(row));
	}
	toDomain(row) {
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
	toRevisionDomain(row) {
		const props = {
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

