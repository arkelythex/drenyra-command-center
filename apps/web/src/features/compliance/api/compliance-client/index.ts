/**
 * Compliance API client — barrel
 *
 * Re-exports all types and utilities from the compliance-client module.
 * Backward-compatible with existing imports from `compliance-client.ts`.
 *
 * @module compliance-client
 */

export type {
	AccountingJobRunStatus,
	AccountingJobRunsListQuery,
	AccountingJobRunsListResponse,
	AccountingJobRunView,
	AccountingJobsCatalogResponse,
	ApiEnvelope,
	AssistantAccountingJob,
	ComplianceRoadmapDecisionPayload,
	ComplianceRoadmapRunPayload,
	ComplianceRoadmapTimelineQuery,
	CountryPackCatalogResponse,
	CpeErrorCatalogItem,
	CpeFallbackProbeBody,
	CpeFallbackProbeData,
	CpeValidationData,
	CpeValidationEnvelope,
	CpeValidationIncident,
	CpeValidationRequestPayload,
	CreateAccountingJobRunPayload,
	ExecuteAccountingJobRunPayload,
	SireDemoSummaryData,
	SireDemoSummaryQuery,
	UpdateAccountingJobRunStatusPayload,
} from "./compliance-client.types";

export {
	getComplianceClient,
	getCpeValidatorClient,
	isCpeValidationEnvelope,
} from "./compliance-client.utils";
