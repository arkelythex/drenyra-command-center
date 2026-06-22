/**
 * HeaderContainer type.
 *
 * @example
 * ```ts
 * const value: HeaderContainer = {} as HeaderContainer;
 * console.log(value);
 * ```
 */
export type HeaderContainer = Headers | Record<string, unknown> | undefined;

/**
 * UploadDocumentBody interface.
 *
 * @example
 * ```ts
 * const value: UploadDocumentBody = {} as UploadDocumentBody;
 * console.log(value);
 * ```
 */
export interface UploadDocumentBody {
	file: File;
	organizationId?: number;
	companyId?: string;
	type?: "invoice" | "receipt" | "contract" | "other";
}

/**
 * BatchUploadBody interface.
 *
 * @example
 * ```ts
 * const value: BatchUploadBody = {} as BatchUploadBody;
 * console.log(value);
 * ```
 */
export interface BatchUploadBody {
	files: File[];
	organizationId?: number;
	companyId?: string;
}

/**
 * ValidateParams interface.
 *
 * @example
 * ```ts
 * const value: ValidateParams = {} as ValidateParams;
 * console.log(value);
 * ```
 */
export interface ValidateParams {
	id: string;
}

/**
 * ValidateBody interface.
 *
 * @example
 * ```ts
 * const value: ValidateBody = {} as ValidateBody;
 * console.log(value);
 * ```
 */
export interface ValidateBody {
	correctedData?: {
		issuerRUC?: string;
		issuerName?: string;
		total?: number;
		igv?: number;
		documentDate?: string;
		pcgeAccount?: string;
	};
	status: "approved" | "needs_review";
}

/**
 * RejectBody interface.
 *
 * @example
 * ```ts
 * const value: RejectBody = {} as RejectBody;
 * console.log(value);
 * ```
 */
export interface RejectBody {
	reason: string;
	category?: "invalid_format" | "duplicate" | "incorrect_data" | "other";
}

/**
 * ListQuery interface.
 *
 * @example
 * ```ts
 * const value: ListQuery = {} as ListQuery;
 * console.log(value);
 * ```
 */
export interface ListQuery {
	organizationId?: number;
	companyId?: string;
	status?:
		| "por_procesar"
		| "procesando"
		| "revision_humana"
		| "listo_para_sire"
		| "rechazado_por_sire"
		| "aprobado"
		| "error";
	period?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

/**
 * UpdateStatusBody interface.
 *
 * @example
 * ```ts
 * const value: UpdateStatusBody = {} as UpdateStatusBody;
 * console.log(value);
 * ```
 */
export interface UpdateStatusBody {
	status: "listo_para_sire" | "rechazado_por_sire";
	reason?: string;
}

/**
 * HandlerSet interface.
 *
 * @example
 * ```ts
 * const value: HandlerSet = {} as HandlerSet;
 * console.log(value);
 * ```
 */
export interface HandlerSet {
	status?: number | string;
}

/**
 * HandlerContext interface.
 *
 * @typeParam TBody - Generic type parameter for HandlerContext.
 * @typeParam TParams - Generic type parameter for HandlerContext.
 * @typeParam TQuery - Generic type parameter for HandlerContext.
 * @example
 * ```ts
 * const value: HandlerContext = {} as HandlerContext;
 * console.log(value);
 * ```
 */
export interface HandlerContext<
	TBody = unknown,
	TParams = unknown,
	TQuery = unknown,
> {
	body: TBody;
	params: TParams;
	query: TQuery;
	headers: HeaderContainer;
	set: HandlerSet;
}

/**
 * UploadHandlerContext type.
 *
 * @example
 * ```ts
 * const value: UploadHandlerContext = {} as UploadHandlerContext;
 * console.log(value);
 * ```
 */
export type UploadHandlerContext = Pick<
	HandlerContext<UploadDocumentBody>,
	"body" | "headers" | "set"
>;

/**
 * BatchUploadHandlerContext type.
 *
 * @example
 * ```ts
 * const value: BatchUploadHandlerContext = {} as BatchUploadHandlerContext;
 * console.log(value);
 * ```
 */
export type BatchUploadHandlerContext = Pick<
	HandlerContext<BatchUploadBody>,
	"body" | "headers" | "set"
>;

/**
 * ValidateHandlerContext type.
 *
 * @example
 * ```ts
 * const value: ValidateHandlerContext = {} as ValidateHandlerContext;
 * console.log(value);
 * ```
 */
export type ValidateHandlerContext = Pick<
	HandlerContext<ValidateBody, ValidateParams>,
	"body" | "params" | "headers" | "set"
>;

/**
 * RejectHandlerContext type.
 *
 * @example
 * ```ts
 * const value: RejectHandlerContext = {} as RejectHandlerContext;
 * console.log(value);
 * ```
 */
export type RejectHandlerContext = Pick<
	HandlerContext<RejectBody, ValidateParams>,
	"body" | "params" | "headers" | "set"
>;

/**
 * UpdateStatusHandlerContext type.
 *
 * @example
 * ```ts
 * const value: UpdateStatusHandlerContext = {} as UpdateStatusHandlerContext;
 * console.log(value);
 * ```
 */
export type UpdateStatusHandlerContext = Pick<
	HandlerContext<UpdateStatusBody, ValidateParams>,
	"body" | "params" | "headers" | "set"
>;

/**
 * ListHandlerContext type.
 *
 * @example
 * ```ts
 * const value: ListHandlerContext = {} as ListHandlerContext;
 * console.log(value);
 * ```
 */
export type ListHandlerContext = Pick<
	HandlerContext<unknown, unknown, ListQuery>,
	"query" | "headers" | "set"
>;

/**
 * GetByIdHandlerContext type.
 *
 * @example
 * ```ts
 * const value: GetByIdHandlerContext = {} as GetByIdHandlerContext;
 * console.log(value);
 * ```
 */
export type GetByIdHandlerContext = Pick<
	HandlerContext<unknown, ValidateParams>,
	"params" | "headers" | "set"
>;
