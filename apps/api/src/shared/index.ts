/**
 * Shared utilities and plugins for the Drenyra API.
 *
 * @module shared
 */

// ─── API Response Envelope ─────────────────────────────────────────
export type {
	ResponseMeta,
	SuccessResponse,
	ErrorDetail,
	FailureResponse,
	ApiResponse,
} from "./api-response";
export { ok, fail, getErrorMessage } from "./api-response";

// ─── Error Codes ───────────────────────────────────────────────────
export type { ErrorCode } from "./error-codes";
export { ErrorCodes } from "./error-codes";

// ─── Plugins ───────────────────────────────────────────────────────
export type {
	CompanyContext,
	CompanyScopeGuardOptions,
} from "./plugins/company-scope-guard";
export { companyScopeGuard } from "./plugins/company-scope-guard";

// --- Error Codes ---
export { ThreadErrorCodes } from "./error-codes";
export type { ThreadErrorCode } from "./error-codes";
