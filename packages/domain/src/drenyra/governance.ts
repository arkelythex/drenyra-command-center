/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type { FiscalScope } from "./types";

export const DRENYRA_TOOL_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type DrenyraToolRiskLevel = (typeof DRENYRA_TOOL_RISK_LEVELS)[number];

export const DRENYRA_TOOL_APPROVAL_LEVELS = [
	"auto",
	"notify",
	"gate",
	"fiscal_gate",
] as const;
export type DrenyraToolApprovalLevel =
	(typeof DRENYRA_TOOL_APPROVAL_LEVELS)[number];

export interface DrenyraToolCapabilityManifest {
	toolName: string;
	capability: string;
	riskLevel: DrenyraToolRiskLevel;
	approvalLevel: DrenyraToolApprovalLevel;
	allowedScopes: readonly FiscalScope[];
	redactionRequired: boolean;
}

export interface DrenyraToolGovernanceRequest {
	manifest?: DrenyraToolCapabilityManifest;
	scope: FiscalScope;
	hasHumanApproval: boolean;
	redactionStatus: "passed" | "failed" | "not_required";
}

export interface DrenyraToolGovernanceDecision {
	allowed: boolean;
	reason:
		| "TOOL_NOT_REGISTERED"
		| "SCOPE_NOT_ALLOWED"
		| "HUMAN_APPROVAL_REQUIRED"
		| "REDACTION_FAILED"
		| "ALLOWED";
}

function isSameFiscalScope(left: FiscalScope, right: FiscalScope): boolean {
	return (
		left.companyId === right.companyId &&
		left.companyRuc === right.companyRuc &&
		left.organizationId === right.organizationId &&
		left.period === right.period &&
		left.countryCode === right.countryCode
	);
}

function requiresHumanApproval(manifest: DrenyraToolCapabilityManifest): boolean {
	return (
		manifest.approvalLevel === "gate" ||
		manifest.approvalLevel === "fiscal_gate" ||
		manifest.riskLevel === "HIGH" ||
		manifest.riskLevel === "CRITICAL"
	);
}

export function evaluateDrenyraToolGovernance(
	request: DrenyraToolGovernanceRequest,
): DrenyraToolGovernanceDecision {
	const { manifest } = request;
	if (!manifest) {
		return { allowed: false, reason: "TOOL_NOT_REGISTERED" };
	}

	const scopeAllowed = manifest.allowedScopes.some((allowedScope) =>
		isSameFiscalScope(allowedScope, request.scope),
	);
	if (!scopeAllowed) {
		return { allowed: false, reason: "SCOPE_NOT_ALLOWED" };
	}

	if (
		manifest.redactionRequired &&
		request.redactionStatus !== "passed"
	) {
		return { allowed: false, reason: "REDACTION_FAILED" };
	}

	if (requiresHumanApproval(manifest) && !request.hasHumanApproval) {
		return { allowed: false, reason: "HUMAN_APPROVAL_REQUIRED" };
	}

	return { allowed: true, reason: "ALLOWED" };
}
