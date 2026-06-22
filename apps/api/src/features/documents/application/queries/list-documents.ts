/**
 * ListDocuments — Returns documents with optional filters and status counts.
 *
 * @module documents/application/queries
 */

import type { ResolvedTenantScope } from "../../handlers/tenant-scope";
import type { DocumentStorePort } from "../../ports/document-store.port";

export interface ListDocumentsInput {
	store: DocumentStorePort;
	tenantScope: ResolvedTenantScope;
	status?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

export interface ListDocumentsResult {
	documents: ReturnType<DocumentStorePort["toResponseDTO"]>[];
	total: number;
	counts: {
		porProcesar: number;
		revisionHumana: number;
		listoParaSIRE: number;
		rechazadoPorSIRE: number;
		total: number;
	};
}

/**
 * Lists documents with tenant scoping and optional filters.
 * Returns documents mapped to response DTOs with Kanban-style status counts.
 *
 * @param input - List query input with store and filters
 * @returns Documents with status counts
 */
export async function listDocuments(
	input: ListDocumentsInput,
): Promise<ListDocumentsResult> {
	const { store, tenantScope, status, search, limit = 100, offset = 0 } = input;

	const documents = await store.list({
		companyId: tenantScope.companyId,
		organizationId: tenantScope.organizationId,
		status,
		search,
		limit,
		offset,
	});

	const mappedDocuments = documents.map((doc) => store.toResponseDTO(doc));
	const counts = {
		porProcesar: documents.filter((d) => d.status === "por_procesar").length,
		revisionHumana: documents.filter((d) => d.status === "revision_humana")
			.length,
		listoParaSIRE: documents.filter((d) => d.status === "listo_para_sire")
			.length,
		rechazadoPorSIRE: documents.filter((d) => d.status === "rechazado_por_sire")
			.length,
	};

	return {
		documents: mappedDocuments,
		total: documents.length,
		counts: {
			...counts,
			total:
				counts.porProcesar +
				counts.revisionHumana +
				counts.listoParaSIRE +
				counts.rechazadoPorSIRE,
		},
	};
}
