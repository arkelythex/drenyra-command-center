import type { Money } from "../_domain-types/money";
import { RUC } from "../_domain-types/ruc";
import { DETERMINISTIC_REASON_CODE, EVIDENCE_NODE_KIND, type GOVERNANCE_REVIEW_STATUS, type POLICY_OUTCOME, type REPLAY_FAILURE_CODE } from "./constants";
export type EvidenceNodeKind = (typeof EVIDENCE_NODE_KIND)[keyof typeof EVIDENCE_NODE_KIND];
export type GovernanceReviewStatus = (typeof GOVERNANCE_REVIEW_STATUS)[keyof typeof GOVERNANCE_REVIEW_STATUS];
export type PolicyOutcome = (typeof POLICY_OUTCOME)[keyof typeof POLICY_OUTCOME];
export type ReplayFailureCode = (typeof REPLAY_FAILURE_CODE)[keyof typeof REPLAY_FAILURE_CODE];
export type DeterministicReasonCode = (typeof DETERMINISTIC_REASON_CODE)[keyof typeof DETERMINISTIC_REASON_CODE];
export interface FiscalTruthScope {
    companyId: string;
    companyRuc: string;
    organizationId: number | null;
    period: string;
    countryCode: string;
}
export interface FiscalTruthTrace {
    traceId: string;
    correlationId: string;
    causationId: string | null;
}
export interface GovernanceBundleReference {
    governanceBundleId: string;
    policyVersion: string;
    specVersion: string;
    architectureDocVersion: string;
    glossaryVersion: string;
    adrIds: string[];
    reviewStatus: GovernanceReviewStatus;
    approvedAt: string | null;
}
export interface DeterministicValidatorResultRecord {
    validatorName: string;
    validatorVersion: string;
    inputHash: string;
    isValid: boolean;
    code: string;
    reason: string;
    severity: "info" | "warning" | "blocking";
    observedAt: string;
    payload: Record<string, unknown>;
}
export interface PolicyDecisionRecord {
    decisionId: string;
    policyVersion: string;
    governance: GovernanceBundleReference;
    outcome: PolicyOutcome;
    rationale: string;
    decidedAt: string;
}
export interface ReplayResult {
    success: boolean;
    reproducedEventId: string | null;
    reproducedOutcomeHash: string | null;
    failureCode: ReplayFailureCode | null;
    message: string;
}
export interface PromotionGuardInput {
    evidenceNodeKind: EvidenceNodeKind;
    hasDeterministicValidation: boolean;
    hasRequiredApproval: boolean;
    evidenceRootNodeId?: string;
    hasSameScopeGraphLinks?: boolean;
    hasApprovedGovernancePolicyDecision?: boolean;
    hasHumanMaterialApproval?: boolean;
}
export interface RucIgvDeterministicInput {
    ruc: RUC;
    subtotal: Money;
    igv: Money;
    validatorVersion: string;
}
export interface RucIgvDeterministicResult {
    validatorVersion: string;
    isValid: boolean;
    code: DeterministicReasonCode;
    reason: string;
    ruc: string;
    subtotalCents: number;
    igvCents: number;
    expectedIgvCents: number;
}
export interface ChainVerificationResult {
    valid: boolean;
    count: number;
    brokenLinks: Array<{
        index: number;
        eventId: string;
        expectedPrevHash: string | null;
        actualPrevHash: string | null;
        expectedChainHash: string;
        actualChainHash: string;
    }>;
}
export declare function isFiscalTruthScope(value: FiscalTruthScope): boolean;
export declare function canPromoteAuthoritativeTruth(input: PromotionGuardInput): boolean;
export declare function toReplayFailureResult(failureCode: ReplayFailureCode, message: string): ReplayResult;
export declare function buildRucIgvDeterministicResult(input: RucIgvDeterministicInput): RucIgvDeterministicResult;
//# sourceMappingURL=fiscal-truth.d.ts.map