import { getDocumentById } from "../application/queries/get-document-by-id";
import { listDocuments } from "../application/queries/list-documents";
import { documentStore } from "../documents.repository";
import type { DocumentStorePort } from "../ports/document-store.port";
import {
	authorizeDocumentAccess,
	DOCUMENTS_SECURITY_OPERATION,
} from "./access";
import { fail, toErrorMessage } from "./shared";
import {
	resolveOrganizationIdFromCompanyId as defaultResolveOrganizationIdFromCompanyId,
	type ResolveOrganizationIdFromCompanyId,
} from "./tenant-scope";
import type { GetByIdHandlerContext, ListHandlerContext } from "./types";

/**
 * QueryHandlersDeps interface.
 *
 * @example
 * ```ts
 * const value: QueryHandlersDeps = {} as QueryHandlersDeps;
 * console.log(value);
 * ```
 */
export interface QueryHandlersDeps {
	documentStore: DocumentStorePort;
	resolveOrganizationIdFromCompanyId: ResolveOrganizationIdFromCompanyId;
}

/**
 * createQueryHandlers operation.
 *
 * @param deps - Input for deps.
 * @returns Result of createQueryHandlers.
 * @example
 * ```ts
 * const result = createQueryHandlers({} as Partial);
 * console.log(result);
 * ```
 */
export function createQueryHandlers(deps: Partial<QueryHandlersDeps> = {}) {
	const store = deps.documentStore ?? documentStore;
	const resolveOrganizationIdFromCompanyId =
		deps.resolveOrganizationIdFromCompanyId ??
		defaultResolveOrganizationIdFromCompanyId;

	async function listDocumentsHandler({
		query,
		headers,
		set,
	}: ListHandlerContext) {
		const {
			companyId,
			organizationId,
			status,
			search,
			limit = 100,
			offset = 0,
		} = query;

		try {
			const access = await authorizeDocumentAccess({
				headers,
				operation: DOCUMENTS_SECURITY_OPERATION.QUERY_READ,
				resource: "/documents",
				resolveOrganizationIdFromCompanyId,
				assertedCompanyId: companyId,
				assertedOrganizationId: organizationId,
			});
			if (!access.ok) {
				return fail(set, access.status, access.error, access.code as never);
			}

			const result = await listDocuments({
				store,
				tenantScope: access.access.tenantScope,
				status,
				search,
				limit,
				offset,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error: unknown) {
			return fail(
				set,
				500,
				toErrorMessage(error, "Failed to fetch documents"),
				"DOCUMENTS_INTERNAL_ERROR",
			);
		}
	}

	async function getDocumentByIdHandler({
		params,
		headers,
		set,
	}: GetByIdHandlerContext) {
		const { id } = params;

		try {
			const access = await authorizeDocumentAccess({
				headers,
				operation: DOCUMENTS_SECURITY_OPERATION.QUERY_READ,
				resource: "/documents/:id",
				resolveOrganizationIdFromCompanyId,
			});
			if (!access.ok) {
				return fail(set, access.status, access.error, access.code as never);
			}

			const result = await getDocumentById({
				store,
				tenantScope: access.access.tenantScope,
				id,
			});

			if (!result.found) {
				return fail(set, 404, "Document not found", "DOCUMENTS_NOT_FOUND");
			}

			return {
				success: true,
				data: result.data,
			};
		} catch (error: unknown) {
			return fail(
				set,
				500,
				toErrorMessage(error, "Failed to fetch document"),
				"DOCUMENTS_INTERNAL_ERROR",
			);
		}
	}

	return {
		listDocumentsHandler,
		getDocumentByIdHandler,
	};
}

const defaultHandlers = createQueryHandlers();
/**
 * listDocumentsHandler const.
 *
 * @example
 * ```ts
 * console.log(listDocumentsHandler);
 * ```
 */
export const listDocumentsHandler = defaultHandlers.listDocumentsHandler;
/**
 * getDocumentByIdHandler const.
 *
 * @example
 * ```ts
 * console.log(getDocumentByIdHandler);
 * ```
 */
export const getDocumentByIdHandler = defaultHandlers.getDocumentByIdHandler;
