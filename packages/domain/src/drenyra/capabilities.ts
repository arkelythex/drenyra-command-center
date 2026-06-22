import {
	DRENYRA_CAPABILITY_DECISION,
	DRENYRA_CAPABILITY_RISK,
	DRENYRA_TOOL_ACTION,
	type DrenyraCapabilityEvaluation,
	type DrenyraCapabilityGrant,
	type DrenyraCapabilityPolicy,
	type DrenyraCapabilityRequest,
} from "./capability-types";
import { DRENYRA_CAPABILITY_POLICIES } from "./capability-policies";
import type { DrenyraFiscalScope } from "./types";
import { RUC } from "../value-objects/RUC";

export * from "./capability-types";
export * from "./capability-policies";

export function evaluateDrenyraCapability(input: {
	request: DrenyraCapabilityRequest;
	grants: readonly DrenyraCapabilityGrant[];
	policies?: readonly DrenyraCapabilityPolicy[];
}): DrenyraCapabilityEvaluation {
	const policies = input.policies ?? DRENYRA_CAPABILITY_POLICIES;
	const policy = policies.find(
		(item) =>
			item.agentType === input.request.agentType &&
			item.toolId === input.request.toolId,
	);

	if (!policy) return deny(input.request, "Capability is not registered");
	if (!isCompleteDrenyraCapabilityScope(input.request.scope)) {
		return deny(input.request, "Capability scope is incomplete");
	}
	if (policy.requiresRedaction && !input.request.redactionOk) {
		return deny(input.request, "Required redaction failed");
	}
	if (policy.requiresApproval && !input.request.approvalId) {
		return deny(input.request, "Required approval is missing");
	}

	const hasGrant = input.grants.some(
		(grant) =>
			grant.agentType === input.request.agentType &&
			grant.toolId === input.request.toolId &&
			isSameDrenyraCapabilityScope(grant.scope, input.request.scope),
	);

	if (!hasGrant) return deny(input.request, "Capability grant is missing");

	return {
		decision: DRENYRA_CAPABILITY_DECISION.ALLOWED,
		reason: "Capability allowed for scoped agent tool call",
		policy,
		auditEventType: "CAPABILITY_ALLOWED",
	};
}

export function isCompleteDrenyraCapabilityScope(
	scope: DrenyraFiscalScope,
): boolean {
	return (
		(scope.organizationId ?? "").trim().length > 0 &&
		scope.companyId.trim().length > 0 &&
		RUC.isValid(scope.companyRuc) &&
		/^\d{4}-(0[1-9]|1[0-2])$/.test(scope.period) &&
		scope.countryCode === "PE"
	);
}

export function isSameDrenyraCapabilityScope(
	left: DrenyraFiscalScope,
	right: DrenyraFiscalScope,
): boolean {
	return (
		left.organizationId === right.organizationId &&
		left.companyId === right.companyId &&
		left.companyRuc === right.companyRuc &&
		left.period === right.period &&
		left.countryCode === right.countryCode
	);
}

function deny(
	request: DrenyraCapabilityRequest,
	reason: string,
): DrenyraCapabilityEvaluation {
	return {
		decision: DRENYRA_CAPABILITY_DECISION.DENIED,
		reason,
		policy: {
			agentType: request.agentType,
			toolId: request.toolId,
			action: DRENYRA_TOOL_ACTION.MATERIAL_ACTION,
			risk: DRENYRA_CAPABILITY_RISK.CRITICAL,
			requiresApproval: true,
			requiresRedaction: true,
		},
		auditEventType: "CAPABILITY_DENIED",
	};
}
