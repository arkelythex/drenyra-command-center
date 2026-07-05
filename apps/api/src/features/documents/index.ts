import { Elysia } from "elysia";
import { standardRateLimit } from "../../middleware/rate-limit.middleware";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { documentStore } from "./documents.repository";
import {
	createDocumentsHandlers,
	type DocumentsHandlersDeps,
} from "./handlers";
import { buildDocumentQueryRoutes } from "./routes/query.routes";
import { buildDocumentReviewRoutes } from "./routes/review.routes";
import { buildDocumentUploadRoutes } from "./routes/upload.routes";

type BuildDocumentsRoutesDeps = DocumentsHandlersDeps;

/**
 * buildDocumentsModule operation.
 *
 * @param deps - Input for deps.
 * @returns Result of buildDocumentsModule.
 * @example
 * ```ts
 * const result = buildDocumentsModule({} as BuildDocumentsRoutesDeps);
 * console.log(result);
 * ```
 */
export function buildDocumentsModule(deps: BuildDocumentsRoutesDeps = {}) {
	const handlers = createDocumentsHandlers({
		documentStore: deps.documentStore ?? documentStore,
		resolveActorIdFromHeaders: deps.resolveActorIdFromHeaders,
		parseStoredExtractedData: deps.parseStoredExtractedData,
		queueOcrJob: deps.queueOcrJob,
		resolveOrganizationIdFromCompanyId: deps.resolveOrganizationIdFromCompanyId,
	});

	return new Elysia({ prefix: "/api/documents" })
		.use(companyScopeGuard())
		.use(standardRateLimit)
		.use(buildDocumentUploadRoutes(handlers))
		.use(buildDocumentReviewRoutes(handlers))
		.use(buildDocumentQueryRoutes(handlers));
}

/**
 * documentsModule const.
 *
 * @example
 * ```ts
 * console.log(documentsModule);
 * ```
 */
export const documentsModule = buildDocumentsModule();
