/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type { Money } from "../value-objects/Money";
import { RUC } from "../value-objects/RUC";
import {
	DETERMINISTIC_REASON_CODE,
	EVIDENCE_NODE_KIND,
	GOVERNANCE_REVIEW_STATUS,
	POLICY_OUTCOME,
	REPLAY_FAILURE_CODE,
} from "./constants";

export type EvidenceNodeKind =
	(typeof EVIDENCE_NODE_KIND)[keyof typeof EVIDENCE_NODE_KIND];
export type GovernanceReviewStatus =
	(typeof GOVERNANCE_REVIEW_STATUS)[keyof typeof GOVERNANCE_REVIEW_STATUS];
export type PolicyOutcome =
	(typeof POLICY_OUTCOME)[keyof typeof POLICY_OUTCOME];
export type ReplayFailureCode =
	(typeof REPLAY_FAILURE_CODE)[keyof typeof REPLAY_FAILURE_CODE];
export type DeterministicReasonCode =
	(typeof DETERMINISTIC_REASON_CODE)[keyof typeof DETERMINISTIC_REASON_CODE];

/**
 * Tenant and fiscal ownership scope required by every authoritative operation.
 *
 * Invariant: `companyRuc` MUST be a valid 11-digit SUNAT RUC and `companyId`
 * must be non-empty, otherwise the request is not tenant-safe.
 */
export interface FiscalTruthScope {
	companyId: string;
	companyRuc: string;
	organizationId: number | null;
	period: string;
	countryCode: string;
}

/**
 * Provenance metadata for deterministic audit traceability.
 */
export interface FiscalTruthTrace {
	traceId: string;
	correlationId: string;
	causationId: string | null;
}

/**
 * Governance manifest that authorizes policy activation for fiscal truth.
 *
 * Invariant: only `approved` bundles are eligible for authoritative promotion.
 */
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

/**
 * Deterministic validator output attached to evidence graph nodes.
 */
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

/**
 * Policy decision that gates promotion from evidence to authoritative truth.
 */
export interface PolicyDecisionRecord {
	decisionId: string;
	policyVersion: string;
	governance: GovernanceBundleReference;
	outcome: PolicyOutcome;
	rationale: string;
	decidedAt: string;
}

/**
 * Result of replaying a prior authoritative fiscal decision.
 *
 * Invariant: when `success` is `false`, `failureCode` MUST be present.
 */
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
	/** Every evidence/ontology edge used by the promotion was verified in the same tenant/RUC scope. */
	hasSameScopeGraphLinks?: boolean;
	/** A policy decision exists and belongs to an approved governance bundle. */
	hasApprovedGovernancePolicyDecision?: boolean;
	/** Approval is human/material, not only agent-suggested. */
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

/**
 * Result of verifying the cryptographic hash chain for a fiscal scope.
 *
 * When `valid` is `true`, all events in the scope form an unbroken chain.
 * Pre-migration events (empty-string markers) are skipped during verification.
 */
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

/**
 * Validates minimum tenant scope invariants for fiscal truth operations.
 */
export function isFiscalTruthScope(value: FiscalTruthScope): boolean {
	return (
		value.companyId.trim().length > 0 &&
		RUC.isValid(value.companyRuc) &&
		/^\d{4}-(0[1-9]|1[0-2])$/.test(value.period) &&
		value.countryCode.trim().length > 0
	);
}

/**
 * Evaluates whether evidence is eligible for authoritative promotion.
 *
 * AI suggestions are always advisory and can never be authoritative by themselves.
 */
export function canPromoteAuthoritativeTruth(
	input: PromotionGuardInput,
): boolean {
	const hasEvidenceRoot = (input.evidenceRootNodeId ?? "").trim().length > 0;

	if (!hasEvidenceRoot) {
		return false;
	}

	if (input.evidenceNodeKind === EVIDENCE_NODE_KIND.AI_SUGGESTION) {
		return false;
	}

	return (
		input.hasDeterministicValidation &&
		input.hasRequiredApproval &&
		input.hasSameScopeGraphLinks === true &&
		input.hasApprovedGovernancePolicyDecision === true &&
		input.hasHumanMaterialApproval === true
	);
}

/**
 * Builds a fail-closed replay result with mandatory failure code.
 */
export function toReplayFailureResult(
	failureCode: ReplayFailureCode,
	message: string,
): ReplayResult {
	return {
		success: false,
		reproducedEventId: null,
		reproducedOutcomeHash: null,
		failureCode,
		message,
	};
}

/**
 * Deterministic validator combining RUC validity and IGV math consistency.
 *
 * Invariant: same input and `validatorVersion` always produce same result.
 */
function calculateIgvCentsFromBasisPoints(subtotalCents: number): number {
	const igvBasisPoints = 1800;
	const basisPointDenominator = 10000;
	return Math.floor(
		(subtotalCents * igvBasisPoints + basisPointDenominator / 2) /
			basisPointDenominator,
	);
}

export function buildRucIgvDeterministicResult(
	input: RucIgvDeterministicInput,
): RucIgvDeterministicResult {
	const subtotalCents = input.subtotal.getCents();
	const igvCents = input.igv.getCents();
	const expectedIgvCents = calculateIgvCentsFromBasisPoints(subtotalCents);
	const isRucValid = RUC.isValid(input.ruc.toString());

	if (!isRucValid) {
		return {
			validatorVersion: input.validatorVersion,
			isValid: false,
			code: DETERMINISTIC_REASON_CODE.RUC_INVALID,
			reason: "RUC checksum is invalid for authoritative fiscal promotion.",
			ruc: input.ruc.toString(),
			subtotalCents,
			igvCents,
			expectedIgvCents,
		};
	}

	if (igvCents !== expectedIgvCents) {
		return {
			validatorVersion: input.validatorVersion,
			isValid: false,
			code: DETERMINISTIC_REASON_CODE.IGV_MISMATCH,
			reason: "IGV cents do not match deterministic 18% rule.",
			ruc: input.ruc.toString(),
			subtotalCents,
			igvCents,
			expectedIgvCents,
		};
	}

	return {
		validatorVersion: input.validatorVersion,
		isValid: true,
		code: DETERMINISTIC_REASON_CODE.VALIDATION_OK,
		reason: "RUC and IGV deterministic checks passed.",
		ruc: input.ruc.toString(),
		subtotalCents,
		igvCents,
		expectedIgvCents,
	};
}
