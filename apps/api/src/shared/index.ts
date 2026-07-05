/**
 * Shared utilities and plugins for the Drenyra API.
 *
 * @module shared
 */

// ─── API Response Envelope ─────────────────────────────────────────
export type {
	ApiResponse,
	ErrorDetail,
	FailureResponse,
	ResponseMeta,
	SuccessResponse,
} from "./api-response";
export { fail, getErrorMessage, ok } from "./api-response";
// ─── Error Codes ───────────────────────────────────────────────────
export type { ErrorCode, ThreadErrorCode } from "./error-codes";
// --- Error Codes ---
export { ErrorCodes, ThreadErrorCodes } from "./error-codes";
// ─── Plugins ───────────────────────────────────────────────────────
export type {
	CompanyContext,
	CompanyScopeGuardOptions,
} from "./plugins/company-scope-guard";
export { companyScopeGuard } from "./plugins/company-scope-guard";
