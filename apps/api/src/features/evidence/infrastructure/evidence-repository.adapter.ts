import { Evidence } from "@drenyra/domain";
import type { EvidenceFilters } from "@drenyra/domain/entities/evidence/types";
import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { db } from "@drenyra/persistence/client";
import { and, desc, eq, gte, lte } from "@drenyra/persistence/query";
import { evidence } from "@drenyra/persistence/schema";

const toDomain = (row: typeof evidence.$inferSelect): Evidence =>
	Evidence.fromPrimitives({
		id: row.id,
		organizationId: row.organizationId,
		companyId: row.companyId ?? undefined,
		filename: row.filename,
		mimeType: row.mimeType,
		sizeBytes: row.sizeBytes,
		hash: row.hash,
		hashChain: row.hashChain ?? undefined,
		evidenceType: row.evidenceType,
		source: row.source,
		status: row.status,
		metadata: row.metadata ?? undefined,
		extractedData: row.extractedData ?? undefined,
		classifierResult: row.classifierResult ?? undefined,
		validatedAt: row.validatedAt?.toISOString(),
		validatedBy: row.validatedBy ?? undefined,
		errorMessage: row.errorMessage ?? undefined,
		tags: row.tags ?? undefined,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	});

const buildFilters = (filters?: EvidenceFilters) => {
	if (!filters) return undefined;
	const conditions: ReturnType<typeof and>[] = [];
	if (filters.organizationId)
		conditions.push(eq(evidence.organizationId, filters.organizationId));
	if (filters.companyId)
		conditions.push(eq(evidence.companyId, filters.companyId));
	if (filters.status) conditions.push(eq(evidence.status, filters.status));
	if (filters.evidenceType)
		conditions.push(eq(evidence.evidenceType, filters.evidenceType));
	if (filters.source) conditions.push(eq(evidence.source, filters.source));
	if (filters.dateFrom)
		conditions.push(gte(evidence.createdAt, filters.dateFrom));
	if (filters.dateTo) conditions.push(lte(evidence.createdAt, filters.dateTo));
	return conditions.length > 0 ? and(...conditions) : undefined;
};

export const evidenceRepository: EvidenceRepository = {
	async save(entity: Evidence): Promise<void> {
		await db.insert(evidence).values({
			id: entity.id,
			organizationId: entity.organizationId,
			companyId: entity.companyId ?? null,
			filename: entity.filename,
			mimeType: entity.mimeType,
			sizeBytes: entity.sizeBytes,
			hash: entity.hash,
			evidenceType: entity.evidenceType,
			source: entity.source,
			status: entity.status,
			metadata: entity.metadata ?? null,
			extractedData: entity.extractedData ?? null,
			classifierResult: entity.classifierResult ?? null,
			validatedAt: entity.validatedAt ?? null,
			validatedBy: entity.validatedBy ?? null,
			errorMessage: entity.errorMessage ?? null,
			tags: entity.tags ? [...entity.tags] : null,
		});
	},

	async saveForOrganization(
		entity: Evidence,
		_organizationId: number,
	): Promise<void> {
		await this.save(entity);
	},

	async update(entity: Evidence): Promise<void> {
		await db
			.update(evidence)
			.set({
				status: entity.status,
				evidenceType: entity.evidenceType,
				metadata: entity.metadata ?? null,
				extractedData: entity.extractedData ?? null,
				classifierResult: entity.classifierResult ?? null,
				validatedAt: entity.validatedAt ?? null,
				validatedBy: entity.validatedBy ?? null,
				errorMessage: entity.errorMessage ?? null,
				tags: entity.tags ? [...entity.tags] : null,
				updatedAt: new Date(),
			})
			.where(eq(evidence.id, entity.id));
	},

	async updateForOrganization(
		entity: Evidence,
		_organizationId: number,
	): Promise<void> {
		await this.update(entity);
	},

	async delete(id: string): Promise<void> {
		await db.delete(evidence).where(eq(evidence.id, id));
	},

	async deleteForOrganization(
		id: string,
		_organizationId: number,
	): Promise<void> {
		await db.delete(evidence).where(eq(evidence.id, id));
	},

	async findById(scope: TenantScope, id: string): Promise<Evidence | null> {
		const row = await db.query.evidence.findFirst({
			where: and(
				eq(evidence.id, id),
				eq(evidence.companyId, scope.companyId),
			),
		});
		return row ? toDomain(row) : null;
	},

	async findForOrganization(
		id: string,
		organizationId: number,
	): Promise<Evidence | null> {
		const row = await db.query.evidence.findFirst({
			where: and(
				eq(evidence.id, id),
				eq(evidence.organizationId, String(organizationId)),
			),
		});
		return row ? toDomain(row) : null;
	},

	async findAll(filters?: EvidenceFilters): Promise<Evidence[]> {
		const rows = await db.query.evidence.findMany({
			where: buildFilters(filters),
			orderBy: desc(evidence.createdAt),
		});
		return rows.map(toDomain);
	},

	async findByHash(hash: string): Promise<Evidence | null> {
		const row = await db.query.evidence.findFirst({
			where: eq(evidence.hash, hash),
		});
		return row ? toDomain(row) : null;
	},

	async findPendingClassification(limit?: number): Promise<Evidence[]> {
		const rows = await db.query.evidence.findMany({
			where: eq(evidence.status, "UPLOADED"),
			orderBy: desc(evidence.createdAt),
			limit,
		});
		return rows.map(toDomain);
	},

	async count(filters?: EvidenceFilters): Promise<number> {
		const rows = await db.query.evidence.findMany({
			where: buildFilters(filters),
			columns: { id: true },
		});
		return rows.length;
	},
};
