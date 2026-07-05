import {
	FISCAL_POLICY_VIOLATION_CODES,
	type FiscalApprovalLevel,
	type FiscalPolicyInput,
	type FiscalPolicyResult,
	type FiscalPolicyViolationCode,
	type SunatImpact,
} from "./fiscal-policy.types";
import {
	isUnmappedFiscalTool,
	resolveFiscalToolMapping,
} from "./fiscal-policy-rules";

const MUTATION_ACTIONS = new Set(["write", "execute", "admin"]);

export const deriveFiscalApprovalLevel = (
	sunatImpact: SunatImpact,
): FiscalApprovalLevel => {
	switch (sunatImpact) {
		case "none":
			return "auto";
		case "low":
			return "notify";
		case "medium":
			return "gate";
		case "high":
			return "fiscal_gate";
		case "critical":
			return "deny";
	}
};

const isValidFiscalScope = (
	scope: FiscalPolicyInput["tenantScope"],
): boolean => {
	return Boolean(
		scope?.tenantId &&
			scope.organizationId &&
			scope.companyId &&
			scope.ruc &&
			/^\d{11}$/.test(scope.ruc),
	);
};

const isMutationAction = (action: FiscalPolicyInput["action"]): boolean => {
	return MUTATION_ACTIONS.has(action);
};

const requiresEvidence = (input: FiscalPolicyInput): boolean => {
	const mapping = resolveFiscalToolMapping(input.toolName);
	return Boolean(
		mapping?.requiresEvidence ||
			input.documentType === "sire" ||
			input.documentType === "ple",
	);
};

const requiresDeterministicEngine = (input: FiscalPolicyInput): boolean => {
	return Boolean(
		resolveFiscalToolMapping(input.toolName)?.requiresDeterministicEngine,
	);
};

export const evaluateFiscalPolicy = (
	input: FiscalPolicyInput,
): FiscalPolicyResult => {
	const mapping = resolveFiscalToolMapping(input.toolName);
	const sunatImpact =
		input.sunatImpact ?? mapping?.defaultSunatImpact ?? "none";
	const approvalLevel = deriveFiscalApprovalLevel(sunatImpact);
	const violations: FiscalPolicyViolationCode[] = [];

	if (isUnmappedFiscalTool(input.toolName)) {
		violations.push(FISCAL_POLICY_VIOLATION_CODES.FISCAL_TOOL_MAPPING_REQUIRED);
	}

	if (sunatImpact !== "none" && !isValidFiscalScope(input.tenantScope)) {
		violations.push(FISCAL_POLICY_VIOLATION_CODES.FISCAL_SCOPE_REQUIRED);
	}

	if (
		input.accountingPeriodStatus === "closed" &&
		isMutationAction(input.action)
	) {
		violations.push(FISCAL_POLICY_VIOLATION_CODES.ACCOUNTING_PERIOD_CLOSED);
	}

	if (
		(input.documentType === "cpe" || mapping?.immutableWhenAcceptedCpe) &&
		input.documentStatus === "accepted" &&
		isMutationAction(input.action)
	) {
		violations.push(FISCAL_POLICY_VIOLATION_CODES.CPE_IMMUTABLE);
	}

	if (requiresEvidence(input) && (input.evidenceRefs?.length ?? 0) === 0) {
		violations.push(FISCAL_POLICY_VIOLATION_CODES.EVIDENCE_REQUIRED);
	}

	if (requiresDeterministicEngine(input) && !input.deterministicEngineRef) {
		violations.push(
			FISCAL_POLICY_VIOLATION_CODES.DETERMINISTIC_ENGINE_REQUIRED,
		);
	}

	if (approvalLevel === "deny") {
		violations.push(FISCAL_POLICY_VIOLATION_CODES.CRITICAL_SUNAT_IMPACT_DENIED);
	}

	return {
		traceId: input.traceId,
		toolName: input.toolName,
		allowed: violations.length === 0,
		sunatImpact,
		approvalLevel,
		requiresApproval:
			approvalLevel === "gate" || approvalLevel === "fiscal_gate",
		violations,
		...(mapping ? { mapping } : {}),
	};
};
