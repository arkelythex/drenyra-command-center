import {
	createQueryHandlers,
	getDocumentByIdHandler,
	listDocumentsHandler,
	type QueryHandlersDeps,
} from "./query.handlers";
import {
	createReviewHandlers,
	type ReviewHandlersDeps,
	rejectDocumentHandler,
	updateDocumentStatusHandler,
	validateDocumentHandler,
} from "./review.handlers";
import type { QueueOcrJobFn } from "./shared";
import type { ResolveOrganizationIdFromCompanyId } from "./tenant-scope";
import type { HeaderContainer } from "./types";
import {
	batchUploadDocumentsHandler,
	createUploadHandlers,
	type UploadHandlersDeps,
	uploadDocumentHandler,
} from "./upload.handlers";

/**
 * DocumentsHandlersDeps interface.
 *
 * @example
 * ```ts
 * const value: DocumentsHandlersDeps = {} as DocumentsHandlersDeps;
 * console.log(value);
 * ```
 */
export interface DocumentsHandlersDeps {
	documentStore?: UploadHandlersDeps["documentStore"] &
		ReviewHandlersDeps["documentStore"] &
		QueryHandlersDeps["documentStore"];
	resolveActorIdFromHeaders?: (
		headers: HeaderContainer,
	) => Promise<string> | string;
	parseStoredExtractedData?: (raw: unknown) => Record<string, unknown>;
	queueOcrJob?: QueueOcrJobFn;
	resolveOrganizationIdFromCompanyId?: ResolveOrganizationIdFromCompanyId;
}

/**
 * createDocumentsHandlers operation.
 *
 * @param deps - Input for deps.
 * @returns Result of createDocumentsHandlers.
 * @example
 * ```ts
 * const result = createDocumentsHandlers({} as DocumentsHandlersDeps);
 * console.log(result);
 * ```
 */
export function createDocumentsHandlers(deps: DocumentsHandlersDeps = {}) {
	return {
		...createUploadHandlers({
			documentStore: deps.documentStore,
			resolveActorIdFromHeaders: deps.resolveActorIdFromHeaders,
			queueOcrJob: deps.queueOcrJob,
			resolveOrganizationIdFromCompanyId:
				deps.resolveOrganizationIdFromCompanyId,
		}),
		...createReviewHandlers({
			documentStore: deps.documentStore,
			resolveActorIdFromHeaders: deps.resolveActorIdFromHeaders,
			parseStoredExtractedData: deps.parseStoredExtractedData,
			resolveOrganizationIdFromCompanyId:
				deps.resolveOrganizationIdFromCompanyId,
		}),
		...createQueryHandlers({
			documentStore: deps.documentStore,
			resolveOrganizationIdFromCompanyId:
				deps.resolveOrganizationIdFromCompanyId,
		}),
	};
}

export {
	batchUploadDocumentsHandler,
	getDocumentByIdHandler,
	listDocumentsHandler,
	rejectDocumentHandler,
	updateDocumentStatusHandler,
	uploadDocumentHandler,
	validateDocumentHandler,
};
