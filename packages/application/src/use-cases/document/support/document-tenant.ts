import type { Document } from "@drenyra/domain/entities/Document";
import type { DocumentRepository } from "@drenyra/domain/repositories/document.repository";

/**
 * DocumentTenantContext interface.
 *
 * @example
 * ```ts
 * const value: DocumentTenantContext = {} as DocumentTenantContext;
 * console.log(value);
 * ```
 */
export interface DocumentTenantContext {
	companyId: string;
}

/**
 * saveDocumentWithTenant operation.
 *
 * @param repository - Input for repository.
 * @param document - Input for document.
 * @param tenant - Input for tenant.
 * @returns Result of saveDocumentWithTenant.
 * @example
 * ```ts
 * const result = await saveDocumentWithTenant({} as DocumentRepository, {} as Document, {} as DocumentTenantContext);
 * console.log(result);
 * ```
 */
export async function saveDocumentWithTenant(
	repository: DocumentRepository,
	document: Document,
	tenant: DocumentTenantContext,
): Promise<void> {
	await repository.saveForCompany(document, tenant.companyId);
}

/**
 * updateDocumentWithTenant operation.
 *
 * @param repository - Input for repository.
 * @param document - Input for document.
 * @param tenant - Input for tenant.
 * @returns Result of updateDocumentWithTenant.
 * @example
 * ```ts
 * const result = await updateDocumentWithTenant({} as DocumentRepository, {} as Document, {} as DocumentTenantContext);
 * console.log(result);
 * ```
 */
export async function updateDocumentWithTenant(
	repository: DocumentRepository,
	document: Document,
	tenant: DocumentTenantContext,
): Promise<void> {
	await repository.updateForCompany(document, tenant.companyId);
}

/**
 * findDocumentByTenant operation.
 *
 * @param repository - Input for repository.
 * @param documentId - Input for documentId.
 * @param tenant - Input for tenant.
 * @returns Result of findDocumentByTenant.
 * @example
 * ```ts
 * const result = await findDocumentByTenant({} as DocumentRepository, "", {} as DocumentTenantContext);
 * console.log(result);
 * ```
 */
export async function findDocumentByTenant(
	repository: DocumentRepository,
	documentId: string,
	tenant: DocumentTenantContext,
) {
	return repository.findByIdForCompany(documentId, tenant.companyId);
}
