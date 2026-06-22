/**
 * GetDocumentById — Returns a single document by ID.
 *
 * @module documents/application/queries
 */

import type { ResolvedTenantScope } from "../../handlers/tenant-scope";
import type { DocumentStorePort } from "../../ports/document-store.port";

export interface GetDocumentByIdInput {
	store: DocumentStorePort;
	tenantScope: ResolvedTenantScope;
	id: string;
}

export type GetDocumentByIdResult =
	| { found: true; data: ReturnType<DocumentStorePort["toResponseDTO"]> }
	| { found: false; data: null };

/**
 * Returns a single document by ID, scoped to the tenant.
 *
 * @param input - Query input with store, tenant scope, and document ID
 * @returns The document as response DTO, or not-found indicator
 */
export async function getDocumentById(
	input: GetDocumentByIdInput,
): Promise<GetDocumentByIdResult> {
	const doc = await input.store.getById(input.id, input.tenantScope);
	if (!doc) return { found: false, data: null };

	return { found: true, data: input.store.toResponseDTO(doc) };
}
