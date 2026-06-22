import type {
	BatchUploadHandlerContext,
	GetByIdHandlerContext,
	ListHandlerContext,
	RejectHandlerContext,
	UpdateStatusHandlerContext,
	UploadHandlerContext,
	ValidateHandlerContext,
} from "../handlers/types";

type RouteHandler<TContext> = (context: TContext) => unknown | Promise<unknown>;

/**
 * DocumentsRouteHandlers interface.
 *
 * @example
 * ```ts
 * const value: DocumentsRouteHandlers = {} as DocumentsRouteHandlers;
 * console.log(value);
 * ```
 */
export interface DocumentsRouteHandlers {
	uploadDocumentHandler: RouteHandler<UploadHandlerContext>;
	batchUploadDocumentsHandler: RouteHandler<BatchUploadHandlerContext>;
	validateDocumentHandler: RouteHandler<ValidateHandlerContext>;
	rejectDocumentHandler: RouteHandler<RejectHandlerContext>;
	updateDocumentStatusHandler: RouteHandler<UpdateStatusHandlerContext>;
	listDocumentsHandler: RouteHandler<ListHandlerContext>;
	getDocumentByIdHandler: RouteHandler<GetByIdHandlerContext>;
}
