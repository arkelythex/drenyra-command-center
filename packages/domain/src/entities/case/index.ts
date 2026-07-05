/**
 * Case Entity Module
 *
 * Multi-domain case with extensible projections for cross-domain collaboration.
 */

export type {
	CaseIdentity,
	CaseProjection,
	CaseRepository,
	CaseStatus,
	ClinicalProjection,
	CrossDomainQuery,
	CrossDomainResponse,
	DomainKey,
	FiscalProjection,
	LegalProjection,
	ProjectionMetadata,
} from "./case";
export {
	Case,
	CaseCrossDomainQuery,
	CaseId,
	CaseProjectionAttached,
	CaseProjectionUpdated,
} from "./case";
