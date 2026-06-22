import { and, count, eq, gte, lte, type SQL } from "drizzle-orm";
import { type Document } from "@arkelythex/domain/entities/Document";
import type {
	DocumentFilters,
	DocumentQueryFilters,
	DocumentRepository,
} from "@arkelythex/domain/repositories/document.repository";
import { DatabaseError } from "@arkelythex/shared/errors";
import { db } from "../client";
import { documents } from "../schema/documents.schema";
import {
	mapDocumentRowToEntity,
	mapDocumentToInsert,
	mapDocumentToUpdate,
} from "./support/document-persistence";
import {
	buildDocumentCompanyCompatibilityScope,
} from "./support/document-scope";
import { createOrganizationIdResolver } from "./support/organization-id-cache";

/**
 * DocumentRepositoryImpl class.
 *
 * @example
 * ```ts
 * const value = new DocumentRepositoryImpl();
 * console.log(value);
 * ```
 */
export class DocumentRepositoryImpl implements DocumentRepository {
	private readonly resolveLegacyOrganizationId =
		createOrganizationIdResolver();

	async save(_document: Document): Promise<void> {
		throw new DatabaseError(
			"DocumentRepository.save requires tenant context. Use saveForCompany(document, companyId).",
		);
	}

	async saveForCompany(document: Document, companyId: string): Promise<void> {
		return this.persistDocument(document, companyId);
	}

	async update(_document: Document): Promise<void> {
		throw new DatabaseError(
			"DocumentRepository.update requires tenant context. Use updateForCompany(document, companyId).",
		);
	}

	async updateForCompany(document: Document, companyId: string): Promise<void> {
		try {
			const conditions = await this.buildCompanyScopedConditions(companyId, [
				eq(documents.id, document.id),
			]);

			await db
				.update(documents)
				.set(mapDocumentToUpdate(document))
				.where(and(...conditions));
		} catch (error) {
			throw new DatabaseError(
				`Failed to update document: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	private async persistDocument(
		document: Document,
		companyId: string,
	): Promise<void> {
		try {
			await db.insert(documents).values({
				...mapDocumentToInsert(document),
				organizationId: null,
				companyId,
			});
		} catch (error) {
			throw new DatabaseError(
				`Failed to save document: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async findById(_id: string): Promise<Document | null> {
		throw new DatabaseError(
			"DocumentRepository.findById requires tenant context. Use findByIdForCompany(id, companyId).",
		);
	}

	async findByIdForCompany(
		id: string,
		companyId: string,
	): Promise<Document | null> {
		return this.findDocumentByIdForCompany(id, companyId);
	}

	private async findDocumentByIdForCompany(
		id: string,
		companyId: string,
	): Promise<Document | null> {
		try {
			const conditions = await this.buildCompanyScopedConditions(companyId, [
				eq(documents.id, id),
			]);

			const result = await db
				.select()
				.from(documents)
				.where(and(...conditions))
				.limit(1);

			if (result.length === 0) return null;

			const row = result[0];
			if (!row) return null;

			return mapDocumentRowToEntity(row);
		} catch (error) {
			throw new DatabaseError(
				`Failed to find document: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async findAll(filters: DocumentFilters): Promise<Document[]> {
		try {
			const conditions = await this.buildWhereConditions(filters);

			const result = await db
				.select()
				.from(documents)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(documents.uploadedAt);

			return result.map(mapDocumentRowToEntity);
		} catch (error) {
			throw new DatabaseError(
				`Failed to find documents: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async count(filters: DocumentFilters): Promise<number> {
		try {
			const conditions = await this.buildWhereConditions(filters);

			const [result] = await db
				.select({ count: count() })
				.from(documents)
				.where(conditions.length > 0 ? and(...conditions) : undefined);

			return result?.count ?? 0;
		} catch (error) {
			throw new DatabaseError(
				`Failed to count documents: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	private async buildWhereConditions(filters: DocumentFilters) {
		return this.buildCompanyScopedConditions(filters.companyId, filters);
	}

	private async buildCompanyScopedConditions(
		companyId: string,
		filtersOrConditions: DocumentQueryFilters | SQL[],
	): Promise<SQL[]> {
		const legacyOrganizationId =
			await this.resolveLegacyOrganizationId(companyId);
		const baseConditions = Array.isArray(filtersOrConditions)
			? filtersOrConditions
			: [];
		const queryFilters = Array.isArray(filtersOrConditions)
			? {}
			: filtersOrConditions;

		return this.buildQueryConditions(
			[
				...baseConditions,
				buildDocumentCompanyCompatibilityScope(companyId, legacyOrganizationId),
			],
			queryFilters,
		);
	}

	private buildQueryConditions(
		baseConditions: SQL[],
		filters: DocumentQueryFilters,
	): SQL[] {
		const conditions = [...baseConditions];

		if (filters.clientId) {
			conditions.push(eq(documents.clientId, filters.clientId));
		}

		if (filters.status) {
			conditions.push(eq(documents.status, filters.status));
		}

		if (filters.confidenceLevel) {
			conditions.push(eq(documents.confidenceLevel, filters.confidenceLevel));
		}

		if (filters.dateFrom) {
			conditions.push(gte(documents.uploadedAt, filters.dateFrom));
		}

		if (filters.dateTo) {
			conditions.push(lte(documents.uploadedAt, filters.dateTo));
		}

		return conditions;
	}
}
