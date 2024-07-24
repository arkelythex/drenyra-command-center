import { Evidence } from "@drenyra/domain/entities/evidence";
import type {
	EvidenceFilters,
	EvidenceRepository,
} from "@drenyra/domain/repositories/evidence.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { and, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "../../client";
import { evidence } from "../../schema/evidence.schema";
import type { EvidenceRow, NewEvidenceRow } from "./types";

function mapRowToDomain(row: EvidenceRow): Evidence {
	return Evidence.fromPrimitives({
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
}

function mapDomainToRow(domain: Evidence): NewEvidenceRow {
	return {
		id: domain.id,
		organizationId: domain.organizationId,
		companyId: domain.companyId ?? null,
		filename: domain.filename,
		mimeType: domain.mimeType,
		sizeBytes: domain.sizeBytes,
		hash: domain.hash,
		hashChain: domain.hashChain ?? null,
		evidenceType: domain.evidenceType,
		source: domain.source,
		status: domain.status,
		metadata: domain.metadata ?? null,
		extractedData: domain.extractedData ?? null,
		classifierResult: domain.classifierResult ?? null,
		validatedAt: domain.validatedAt ?? null,
		validatedBy: domain.validatedBy ?? null,
		errorMessage: domain.errorMessage ?? null,
		tags: domain.tags && domain.tags.length > 0 ? [...domain.tags] : null,
	};
}

export class PostgresEvidenceRepository implements EvidenceRepository {
	async save(domain: Evidence): Promise<void> {
		const row = mapDomainToRow(domain);

		await db.insert(evidence).values(row);
	}

	async saveForOrganization(
		domain: Evidence,
		organizationId: number,
	): Promise<void> {
		const row = mapDomainToRow(domain);

		await db.insert(evidence).values({
			...row,
			organizationId: String(organizationId),
		});
	}

	async update(domain: Evidence): Promise<void> {
		const row = mapDomainToRow(domain);

		await db.update(evidence).set(row).where(eq(evidence.id, domain.id));
	}

	async updateForOrganization(
		domain: Evidence,
		organizationId: number,
	): Promise<void> {
		const row = mapDomainToRow(domain);

		await db
			.update(evidence)
			.set(row)
			.where(
				and(
					eq(evidence.id, domain.id),
					eq(evidence.organizationId, String(organizationId)),
				),
			);
	}

	async delete(id: string): Promise<void> {
		await db.delete(evidence).where(eq(evidence.id, id));
	}

	async deleteForOrganization(
		id: string,
		organizationId: number,
	): Promise<void> {
		await db
			.delete(evidence)
			.where(
				and(
					eq(evidence.id, id),
					eq(evidence.organizationId, String(organizationId)),
				),
			);
	}

	async findById(scope: TenantScope, id: string): Promise<Evidence | null> {
		const rows = await db
			.select()
			.from(evidence)
			.where(
				and(eq(evidence.id, id), eq(evidence.companyId, scope.companyId)),
			)
			.limit(1);

		if (rows.length === 0) {
			return null;
		}

		return mapRowToDomain(rows[0]);
	}

	async findForOrganization(
		id: string,
		organizationId: number,
	): Promise<Evidence | null> {
		const rows = await db
			.select()
			.from(evidence)
			.where(
				and(
					eq(evidence.id, id),
					eq(evidence.organizationId, String(organizationId)),
				),
			)
			.limit(1);

		if (rows.length === 0) {
			return null;
		}

		return mapRowToDomain(rows[0]);
	}

	async findAll(filters?: EvidenceFilters): Promise<Evidence[]> {
		const whereConditions: SQL<unknown>[] = [];

		if (filters?.status) {
			whereConditions.push(eq(evidence.status, filters.status));
		}

		if (filters?.evidenceType) {
			whereConditions.push(eq(evidence.evidenceType, filters.evidenceType));
		}

		if (filters?.source) {
			whereConditions.push(eq(evidence.source, filters.source));
		}

		if (filters?.organizationId) {
			whereConditions.push(eq(evidence.organizationId, filters.organizationId));
		}

		if (filters?.companyId) {
			whereConditions.push(eq(evidence.companyId, filters.companyId));
		}

		if (filters?.dateFrom) {
			whereConditions.push(gte(evidence.createdAt, filters.dateFrom));
		}

		if (filters?.dateTo) {
			whereConditions.push(lte(evidence.createdAt, filters.dateTo));
		}

		const rows = await db
			.select()
			.from(evidence)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
			.orderBy(evidence.createdAt);

		return rows.map(mapRowToDomain);
	}

	async findByHash(hash: string): Promise<Evidence | null> {
		const rows = await db
			.select()
			.from(evidence)
			.where(eq(evidence.hash, hash))
			.limit(1);

		if (rows.length === 0) {
			return null;
		}

		return mapRowToDomain(rows[0]);
	}

	async findPendingClassification(limit?: number): Promise<Evidence[]> {
		const base = db
			.select()
			.from(evidence)
			.where(eq(evidence.status, "EXTRACTING"))
			.orderBy(evidence.createdAt);

		const rows = limit !== undefined ? await base.limit(limit) : await base;

		return rows.map(mapRowToDomain);
	}

	async count(filters?: EvidenceFilters): Promise<number> {
		const whereConditions: SQL<unknown>[] = [];

		if (filters?.status) {
			whereConditions.push(eq(evidence.status, filters.status));
		}

		if (filters?.evidenceType) {
			whereConditions.push(eq(evidence.evidenceType, filters.evidenceType));
		}

		if (filters?.organizationId) {
			whereConditions.push(eq(evidence.organizationId, filters.organizationId));
		}

		if (filters?.companyId) {
			whereConditions.push(eq(evidence.companyId, filters.companyId));
		}

		const rows = await db
			.select()
			.from(evidence)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

		return rows.length;
	}
}
