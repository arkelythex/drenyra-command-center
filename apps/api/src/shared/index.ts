/**
 * Shared utilities and plugins for the Arkelythex API.
 *
 * @module shared
 */

export type {
	CompanyContext,
	CompanyScopeGuardOptions,
} from "./plugins/company-scope-guard";
export { companyScopeGuard } from "./plugins/company-scope-guard";

// --- Error Codes ---
export { ThreadErrorCodes } from "./error-codes";
export type { ThreadErrorCode } from "./error-codes";
