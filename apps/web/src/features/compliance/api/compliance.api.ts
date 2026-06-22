/**
 * Compliance API client (Type-safe)
 *
 * Barrel — re-exports from sub-modules for backward compatibility.
 *
 * Provides typed wrappers around Eden Treaty API calls for the compliance
 * feature. Uses typed helper wrappers around Treaty branches.
 *
 * Pattern: matches `banking.api.ts` and `dashboard.api.ts`.
 */

export { complianceApi } from "./compliance";

export type {
	AccountingJobRunStatus,
	AccountingJobRunsListResponse,
	AccountingJobRunView,
	AccountingJobsCatalogResponse,
	AssistantAccountingJob,
	CountryPackCatalogResponse,
} from "./compliance-client";
