/**
 * Case Entity Module
 *
 * Multi-domain case with extensible projections for cross-domain collaboration.
 */

export {
  Case,
  CaseId,
  CaseProjectionAttached,
  CaseProjectionUpdated,
  CaseCrossDomainQuery,
} from './case'

export type {
  CaseIdentity,
  CaseStatus,
  DomainKey,
  CaseProjection,
  ProjectionMetadata,
  FiscalProjection,
  LegalProjection,
  ClinicalProjection,
  CaseRepository,
  CrossDomainQuery,
  CrossDomainResponse,
} from './case'
