/**
 * Fiscal Guardian — auto-approval policies for low-risk DFAS tool actions.
 * Fail-closed: material actions are NEVER auto-approved.
 */

import {
	DRENYRA_CAPABILITY_DECISION,
	DRENYRA_CAPABILITY_RISK,
	DRENYRA_TOOL_ACTION,
	type DrenyraCapabilityEvaluation,
	type DrenyraCapabilityPolicy,
	type DrenyraCapabilityRequest,
} from "./capability-types";

export const FISCAL_GUARDIAN_DECISION = {
	AUTO_ALLOW: "auto_allow",
	REQUIRE_HUMAN: "require_human",
	DENY: "deny",
} as const;
export type FiscalGuardianDecision =
	(typeof FISCAL_GUARDIAN_DECISION)[keyof typeof FISCAL_GUARDIAN_DECISION];

export interface FiscalGuardianInput {
	capabilityEvaluation: DrenyraCapabilityEvaluation;
	request: DrenyraCapabilityRequest;
	policy: DrenyraCapabilityPolicy;
	materialityScore?: number;
}

export interface FiscalGuardianResult {
	decision: FiscalGuardianDecision;
	reason: string;
	auditEventType:
		| "GUARDIAN_AUTO_ALLOWED"
		| "GUARDIAN_REQUIRE_HUMAN"
		| "GUARDIAN_DENIED";
}

const AUTO_ALLOW_ACTIONS = new Set<string>([
	DRENYRA_TOOL_ACTION.READ,
	DRENYRA_TOOL_ACTION.EXPLAIN,
	DRENYRA_TOOL_ACTION.DRAFT,
]);

const AUTO_ALLOW_RISKS = new Set<string>([DRENYRA_CAPABILITY_RISK.LOW]);

/**
 * Evaluates whether a capability-gated action can proceed without human approval.
 * Material actions and denied capabilities always fail closed.
 */
export function evaluateFiscalGuardian(
	input: FiscalGuardianInput,
): FiscalGuardianResult {
	const { capabilityEvaluation, request, policy } = input;

	if (capabilityEvaluation.decision === DRENYRA_CAPABILITY_DECISION.DENIED) {
		return {
			decision: FISCAL_GUARDIAN_DECISION.DENY,
			reason: capabilityEvaluation.reason,
			auditEventType: "GUARDIAN_DENIED",
		};
	}

	if (policy.action === DRENYRA_TOOL_ACTION.MATERIAL_ACTION) {
		return {
			decision: FISCAL_GUARDIAN_DECISION.REQUIRE_HUMAN,
			reason: "material_action never auto-approved",
			auditEventType: "GUARDIAN_REQUIRE_HUMAN",
		};
	}

	if (policy.requiresApproval) {
		return {
			decision: FISCAL_GUARDIAN_DECISION.REQUIRE_HUMAN,
			reason: "policy requires human approval",
			auditEventType: "GUARDIAN_REQUIRE_HUMAN",
		};
	}

	if (policy.requiresRedaction && !request.redactionOk) {
		return {
			decision: FISCAL_GUARDIAN_DECISION.DENY,
			reason: "redaction proof missing",
			auditEventType: "GUARDIAN_DENIED",
		};
	}

	if (
		AUTO_ALLOW_ACTIONS.has(policy.action) &&
		AUTO_ALLOW_RISKS.has(policy.risk)
	) {
		return {
			decision: FISCAL_GUARDIAN_DECISION.AUTO_ALLOW,
			reason: `auto-allowed ${policy.action} at ${policy.risk} risk`,
			auditEventType: "GUARDIAN_AUTO_ALLOWED",
		};
	}

	return {
		decision: FISCAL_GUARDIAN_DECISION.REQUIRE_HUMAN,
		reason: `${policy.action} at ${policy.risk} risk requires human review`,
		auditEventType: "GUARDIAN_REQUIRE_HUMAN",
	};
}
