import { rejectDocument } from "../application/commands/reject-document";
import { updateDocumentStatus } from "../application/commands/update-document-status";
import { validateDocument } from "../application/commands/validate-document";
import { documentStore } from "../documents.repository";
import type { DocumentStorePort } from "../ports/document-store.port";
import {
	parseStoredExtractedData as defaultParseStoredExtractedData,
	resolveActorIdFromHeaders as defaultResolveActorId,
} from "../security.utils";
import {
	authorizeDocumentAccess,
	DOCUMENTS_SECURITY_OPERATION,
} from "./access";
import { fail, toErrorMessage } from "./shared";
import {
	resolveOrganizationIdFromCompanyId as defaultResolveOrganizationIdFromCompanyId,
	type ResolveOrganizationIdFromCompanyId,
} from "./tenant-scope";
import type {
	HeaderContainer,
	RejectHandlerContext,
	UpdateStatusHandlerContext,
	ValidateHandlerContext,
} from "./types";

/**
 * ReviewHandlersDeps interface.
 *
 * @example
 * ```ts
 * const value: ReviewHandlersDeps = {} as ReviewHandlersDeps;
 * console.log(value);
 * ```
 */
export interface ReviewHandlersDeps {
	documentStore: DocumentStorePort;
	resolveActorIdFromHeaders: (
		headers: HeaderContainer,
	) => Promise<string> | string;
	parseStoredExtractedData: (raw: unknown) => Record<string, unknown>;
	resolveOrganizationIdFromCompanyId: ResolveOrganizationIdFromCompanyId;
}

/**
 * createReviewHandlers operation.
 *
 * @param deps - Input for deps.
 * @returns Result of createReviewHandlers.
 * @example
 * ```ts
 * const result = createReviewHandlers({} as Partial);
 * console.log(result);
 * ```
 */
export function createReviewHandlers(deps: Partial<ReviewHandlersDeps> = {}) {
	const resolvedDeps: ReviewHandlersDeps = {
		documentStore: deps.documentStore ?? documentStore,
		resolveActorIdFromHeaders:
			deps.resolveActorIdFromHeaders ?? defaultResolveActorId,
		parseStoredExtractedData:
			deps.parseStoredExtractedData ?? defaultParseStoredExtractedData,
		resolveOrganizationIdFromCompanyId:
			deps.resolveOrganizationIdFromCompanyId ??
			defaultResolveOrganizationIdFromCompanyId,
	};
	const store = resolvedDeps.documentStore;

	async function validateDocumentHandler({
		params,
		body,
		headers,
		set,
	}: ValidateHandlerContext) {
		const { id } = params;
		const { correctedData, status } = body;

		try {
			const access = await authorizeDocumentAccess({
				headers,
				operation: DOCUMENTS_SECURITY_OPERATION.REVIEW_UPDATE,
				resource: "/documents/validate/:id",
				resolveOrganizationIdFromCompanyId:
					resolvedDeps.resolveOrganizationIdFromCompanyId,
			});
			if (!access.ok) {
				return fail(set, access.status, access.error, access.code as never);
			}

			const actorId = access.access.actorId;
			const result = await validateDocument({
				store,
				tenantScope: access.access.tenantScope,
				id,
				actorId,
				...(correctedData !== undefined ? { correctedData } : {}),
				status,
				parseStoredExtractedData: resolvedDeps.parseStoredExtractedData,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error: unknown) {
			const message = toErrorMessage(error, "Validation failed");
			if (message.includes("Document not found")) {
				return fail(set, 404, message, "DOCUMENTS_NOT_FOUND");
			}
			return fail(set, 500, message, "DOCUMENTS_INTERNAL_ERROR");
		}
	}

	async function rejectDocumentHandler({
		params,
		body,
		headers,
		set,
	}: RejectHandlerContext) {
		const { id } = params;
		const { reason } = body;

		try {
			const access = await authorizeDocumentAccess({
				headers,
				operation: DOCUMENTS_SECURITY_OPERATION.REVIEW_UPDATE,
				resource: "/documents/reject/:id",
				resolveOrganizationIdFromCompanyId:
					resolvedDeps.resolveOrganizationIdFromCompanyId,
			});
			if (!access.ok) {
				return fail(set, access.status, access.error, access.code as never);
			}

			const actorId = access.access.actorId;
			const result = await rejectDocument({
				store,
				tenantScope: access.access.tenantScope,
				id,
				actorId,
				reason,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error: unknown) {
			const message = toErrorMessage(error, "Rejection failed");
			if (message.includes("Document not found")) {
				return fail(set, 404, message, "DOCUMENTS_NOT_FOUND");
			}
			return fail(set, 500, message, "DOCUMENTS_INTERNAL_ERROR");
		}
	}

	async function updateDocumentStatusHandler({
		params,
		body,
		headers,
		set,
	}: UpdateStatusHandlerContext) {
		const { id } = params;
		const { status, reason } = body;

		try {
			const access = await authorizeDocumentAccess({
				headers,
				operation: DOCUMENTS_SECURITY_OPERATION.REVIEW_UPDATE,
				resource: "/documents/:id/status",
				resolveOrganizationIdFromCompanyId:
					resolvedDeps.resolveOrganizationIdFromCompanyId,
			});
			if (!access.ok) {
				return fail(set, access.status, access.error, access.code as never);
			}

			const actorId = access.access.actorId;
			const result = await updateDocumentStatus({
				store,
				tenantScope: access.access.tenantScope,
				id,
				actorId,
				status,
				...(reason !== undefined ? { reason } : {}),
			});

			return {
				success: true,
				data: result.data,
			};
		} catch (error: unknown) {
			const message = toErrorMessage(error, "Status update failed");
			if (message.includes("Document not found")) {
				return fail(set, 404, message, "DOCUMENTS_NOT_FOUND");
			}
			if (message.includes("Reason is required")) {
				return fail(set, 400, message, "DOCUMENTS_BAD_REQUEST");
			}
			return fail(set, 500, message, "DOCUMENTS_INTERNAL_ERROR");
		}
	}

	return {
		validateDocumentHandler,
		rejectDocumentHandler,
		updateDocumentStatusHandler,
	};
}

const defaultHandlers = createReviewHandlers();
/**
 * validateDocumentHandler const.
 *
 * @example
 * ```ts
 * console.log(validateDocumentHandler);
 * ```
 */
export const validateDocumentHandler = defaultHandlers.validateDocumentHandler;
/**
 * rejectDocumentHandler const.
 *
 * @example
 * ```ts
 * console.log(rejectDocumentHandler);
 * ```
 */
export const rejectDocumentHandler = defaultHandlers.rejectDocumentHandler;
/**
 * updateDocumentStatusHandler const.
 *
 * @example
 * ```ts
 * console.log(updateDocumentStatusHandler);
 * ```
 */
export const updateDocumentStatusHandler =
	defaultHandlers.updateDocumentStatusHandler;
