import type { Document, DocumentStatus } from "../entities/Document";

/**
 * Filter options for listing/counting documents.
 *
 * @example
 * ```ts
 * const filters: DocumentFilters = {
 *   companyId: "123e4567-e89b-12d3-a456-426614174001",
 *   status: "PENDING" as DocumentStatus,
 *   dateFrom: new Date("2026-01-01"),
 * };
 * ```
 */
export interface DocumentQueryFilters {
	clientId?: string;
	status?: DocumentStatus;
	dateFrom?: Date;
	dateTo?: Date;
	confidenceLevel?: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * DocumentTenantScope interface.
 *
 * @example
 * ```ts
 * const value: DocumentTenantScope = {} as DocumentTenantScope;
 * console.log(value);
 * ```
 */
export interface DocumentTenantScope {
	companyId: string;
}

/**
 * DocumentFilters type.
 *
 * @example
 * ```ts
 * const value: DocumentFilters = {} as DocumentFilters;
 * console.log(value);
 * ```
 */
export type DocumentFilters = DocumentQueryFilters & DocumentTenantScope;

/**
 * Repository contract for {@link Document} persistence and queries.
 *
 * @example
 * ```ts
 * const repo: DocumentRepository = getDocumentRepository();
 * const pending = await repo.findAll({
 *   companyId: "123e4567-e89b-12d3-a456-426614174001",
 *   status: "PENDING_VALIDATION" as DocumentStatus,
 * });
 * ```
 */
export interface DocumentRepository {
	save(document: Document): Promise<void>;
	saveForCompany(document: Document, companyId: string): Promise<void>;
	update(document: Document): Promise<void>;
	updateForCompany(document: Document, companyId: string): Promise<void>;
	findById(id: string): Promise<Document | null>;
	findByIdForCompany(id: string, companyId: string): Promise<Document | null>;
	findAll(filters: DocumentFilters): Promise<Document[]>;
	count(filters: DocumentFilters): Promise<number>;
}
