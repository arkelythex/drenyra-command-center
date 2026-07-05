import { DatabaseError } from "@drenyra/shared/errors";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { db } from "../client";
import { documents } from "../schema/documents.schema";
import {
	mapDocumentRowToEntity,
	mapDocumentToInsert,
	mapDocumentToUpdate,
} from "./support/document-persistence";
import { buildDocumentCompanyCompatibilityScope } from "./support/document-scope";
import { createOrganizationIdResolver } from "./support/organization-id-cache";
export class DocumentRepositoryImpl {
	resolveLegacyOrganizationId = createOrganizationIdResolver();
	async save(_document) {
		throw new DatabaseError(
			"DocumentRepository.save requires tenant context. Use saveForCompany(document, companyId).",
		);
	}
	async saveForCompany(document, companyId) {
		return this.persistDocument(document, companyId);
	}
	async update(_document) {
		throw new DatabaseError(
			"DocumentRepository.update requires tenant context. Use updateForCompany(document, companyId).",
		);
	}
	async updateForCompany(document, companyId) {
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
	async persistDocument(document, companyId) {
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
	async findById(_id) {
		throw new DatabaseError(
			"DocumentRepository.findById requires tenant context. Use findByIdForCompany(id, companyId).",
		);
	}
	async findByIdForCompany(id, companyId) {
		return this.findDocumentByIdForCompany(id, companyId);
	}
	async findDocumentByIdForCompany(id, companyId) {
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
	async findAll(filters) {
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
	async count(filters) {
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
	async buildWhereConditions(filters) {
		return this.buildCompanyScopedConditions(filters.companyId, filters);
	}
	async buildCompanyScopedConditions(companyId, filtersOrConditions) {
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
	buildQueryConditions(baseConditions, filters) {
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
//# sourceMappingURL=document.repository.js.map
