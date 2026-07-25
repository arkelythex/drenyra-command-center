import { expedienteService } from "../../expedientes/application/expediente.service";
import { resolveOrganizationId } from "../../journal-entries/application/_helpers";
import { batchUploadDocuments } from "../application/commands/batch-upload-documents";
import { uploadDocument } from "../application/commands/upload-document";
import { documentStore } from "../documents.repository";
import type { DocumentStorePort } from "../ports/document-store.port";
import { resolveActorIdFromHeaders as defaultResolveActorId } from "../security.utils";
import {
	authorizeDocumentAccess,
	DOCUMENTS_SECURITY_OPERATION,
} from "./access";
import {
	queueOcrJob as defaultQueueOcrJob,
	fail,
	type QueueOcrJobFn,
	toErrorMessage,
} from "./shared";
import {
	resolveOrganizationIdFromCompanyId as defaultResolveOrganizationIdFromCompanyId,
	type ResolveOrganizationIdFromCompanyId,
} from "./tenant-scope";
import type {
	BatchUploadHandlerContext,
	HeaderContainer,
	UploadHandlerContext,
} from "./types";

/**
 * UploadHandlersDeps interface.
 *
 * @example
 * ```ts
 * const value: UploadHandlersDeps = {} as UploadHandlersDeps;
 * console.log(value);
 * ```
 */
export interface UploadHandlersDeps {
	documentStore: DocumentStorePort;
	resolveActorIdFromHeaders: (
		headers: HeaderContainer,
	) => Promise<string> | string;
	queueOcrJob: QueueOcrJobFn;
	resolveOrganizationIdFromCompanyId: ResolveOrganizationIdFromCompanyId;
}

/**
 * createUploadHandlers operation.
 *
 * @param deps - Input for deps.
 * @returns Result of createUploadHandlers.
 * @example
 * ```ts
 * const result = createUploadHandlers({} as Partial);
 * console.log(result);
 * ```
 */
export function createUploadHandlers(deps: Partial<UploadHandlersDeps> = {}) {
	const resolvedDeps: UploadHandlersDeps = {
		documentStore: deps.documentStore ?? documentStore,
		resolveActorIdFromHeaders:
			deps.resolveActorIdFromHeaders ?? defaultResolveActorId,
		queueOcrJob: deps.queueOcrJob ?? defaultQueueOcrJob,
		resolveOrganizationIdFromCompanyId:
			deps.resolveOrganizationIdFromCompanyId ??
			defaultResolveOrganizationIdFromCompanyId,
	};
	const store = resolvedDeps.documentStore;

	async function uploadDocumentHandler({
		body,
		headers,
		set,
	}: UploadHandlerContext) {
		const { file } = body;

		if (!file?.name) {
			return fail(set, 400, "No file provided", "DOCUMENTS_BAD_REQUEST");
		}

		try {
			const access = await authorizeDocumentAccess({
				headers,
				operation: DOCUMENTS_SECURITY_OPERATION.UPLOAD_CREATE,
				resource: "/documents/upload",
				resolveOrganizationIdFromCompanyId:
					resolvedDeps.resolveOrganizationIdFromCompanyId,
				assertedCompanyId: body.companyId,
				assertedOrganizationId: body.organizationId,
			});
			if (!access.ok) {
				return fail(set, access.status, access.error, access.code as never);
			}

			const actorId = access.access.actorId;
			const result = await uploadDocument({
				store,
				tenantScope: access.access.tenantScope,
				actorId,
				file,
				queueOcrJob: resolvedDeps.queueOcrJob,
			});

			let expedienteLink: { expedienteId: string; linked: boolean } | undefined;
			if (body.expedienteId && body.companyRuc && body.fiscalPeriod) {
				const expedienteId = body.expedienteId!;
				try {
					const companyId = access.access.tenantScope.companyId!;
					const companyRuc = body.companyRuc!;
					const fiscalPeriod = body.fiscalPeriod!;
					const organizationId = await resolveOrganizationId(companyId);
					const scope = expedienteService.toScope({
						companyId,
						companyRuc,
						organizationId,
						period: fiscalPeriod,
					});
					await expedienteService.linkDocument({
						expedienteId,
						documentId: result.id,
						scope,
					});
					expedienteLink = { expedienteId, linked: true };
				} catch {
					expedienteLink = { expedienteId, linked: false };
				}
			}

			return {
				success: true,
				data: {
					...result,
					...(expedienteLink ? { expedienteLink } : {}),
				},
			};
		} catch (error: unknown) {
			// Map known validation errors from the CQRS function
			const message = toErrorMessage(error, "Upload failed");
			if (message.includes("No file provided")) {
				return fail(set, 400, message, "DOCUMENTS_BAD_REQUEST");
			}
			if (message.includes("Invalid file type")) {
				return fail(set, 400, message, "DOCUMENTS_INVALID_FILE");
			}
			if (message.includes("File content validation failed")) {
				return fail(set, 400, message, "DOCUMENTS_INVALID_FILE");
			}
			if (message.includes("Invalid XML")) {
				return fail(set, 422, message, "DOCUMENTS_XML_PARSE_ERROR");
			}
			return fail(set, 500, message, "DOCUMENTS_INTERNAL_ERROR");
		}
	}

	async function batchUploadDocumentsHandler({
		body,
		headers,
		set,
	}: BatchUploadHandlerContext) {
		const { files } = body;

		if (!files || files.length === 0) {
			return fail(set, 400, "No files provided", "DOCUMENTS_BAD_REQUEST");
		}

		try {
			const access = await authorizeDocumentAccess({
				headers,
				operation: DOCUMENTS_SECURITY_OPERATION.UPLOAD_CREATE,
				resource: "/documents/batch-upload",
				resolveOrganizationIdFromCompanyId:
					resolvedDeps.resolveOrganizationIdFromCompanyId,
				assertedCompanyId: body.companyId,
				assertedOrganizationId: body.organizationId,
			});
			if (!access.ok) {
				return fail(set, access.status, access.error, access.code as never);
			}

			const actorId = access.access.actorId;
			const result = await batchUploadDocuments({
				store,
				tenantScope: access.access.tenantScope,
				actorId,
				files,
				queueOcrJob: resolvedDeps.queueOcrJob,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error: unknown) {
			return fail(
				set,
				500,
				toErrorMessage(error, "Batch upload failed"),
				"DOCUMENTS_INTERNAL_ERROR",
			);
		}
	}

	return {
		uploadDocumentHandler,
		batchUploadDocumentsHandler,
	};
}

const defaultHandlers = createUploadHandlers();
/**
 * uploadDocumentHandler const.
 *
 * @example
 * ```ts
 * console.log(uploadDocumentHandler);
 * ```
 */
export const uploadDocumentHandler = defaultHandlers.uploadDocumentHandler;
/**
 * batchUploadDocumentsHandler const.
 *
 * @example
 * ```ts
 * console.log(batchUploadDocumentsHandler);
 * ```
 */
export const batchUploadDocumentsHandler =
	defaultHandlers.batchUploadDocumentsHandler;
