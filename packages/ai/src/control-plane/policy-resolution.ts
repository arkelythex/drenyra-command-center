import type {
	AgentCapability,
	AgentRegistryEntry,
	ApprovalState,
	PolicyDecision,
	TenantCompanyRucScope,
} from "./contracts";

type CapabilityToolMatrix = Partial<Record<AgentCapability, readonly string[]>>;

export interface ResolvePolicyDecisionInput {
	traceId: string;
	registryEntry: AgentRegistryEntry;
	requestedScope: TenantCompanyRucScope;
	requestedCapability: AgentCapability;
	requestedTool: string;
	capabilityToolMatrix?: CapabilityToolMatrix;
}

export interface LookupAllowedToolsInput {
	registryEntry: AgentRegistryEntry;
	requestedCapability: AgentCapability;
	capabilityToolMatrix?: CapabilityToolMatrix;
}

export interface DeterministicHandoffGuardInput {
	approvalState: ApprovalState;
	decisionAllowed: boolean;
}

const SCOPE_MISMATCH = "scope-mismatch";
const CAPABILITY_NOT_ALLOWED = "capability-not-allowed";
const TOOL_WILDCARD_BLOCKED = "tool-wildcard-blocked";
const TOOL_NOT_ALLOWED = "tool-not-allowed";

const DEFAULT_FALLBACK_MODE: PolicyDecision["fallbackMode"] =
	"deterministic-required";

export const lookupAllowedToolsForCapability = ({
	registryEntry,
	requestedCapability,
	capabilityToolMatrix,
}: LookupAllowedToolsInput): string[] => {
	const declaredByCapability = capabilityToolMatrix?.[requestedCapability];
	if (declaredByCapability && declaredByCapability.length > 0) {
		return registryEntry.allowedTools.filter((tool) =>
			declaredByCapability.includes(tool),
		);
	}

	return [...registryEntry.allowedTools];
};

export const resolvePolicyDecision = ({
	traceId,
	registryEntry,
	requestedScope,
	requestedCapability,
	requestedTool,
	capabilityToolMatrix,
}: ResolvePolicyDecisionInput): PolicyDecision => {
	const violations: string[] = [];

	if (!scopeMatches(registryEntry.tenantScope, requestedScope)) {
		violations.push(SCOPE_MISMATCH);
	}

	if (!registryEntry.capabilities.includes(requestedCapability)) {
		violations.push(CAPABILITY_NOT_ALLOWED);
	}

	if (requestedTool === "*") {
		violations.push(TOOL_WILDCARD_BLOCKED);
	}

	const allowedTools = lookupAllowedToolsForCapability({
		registryEntry,
		requestedCapability,
		...(capabilityToolMatrix !== undefined ? { capabilityToolMatrix } : {}),
	});

	if (!allowedTools.includes(requestedTool)) {
		violations.push(TOOL_NOT_ALLOWED);
	}

	const allowed = violations.length === 0;

	return {
		traceId,
		tenantScope: requestedScope,
		allowed,
		fallbackMode: allowed ? "allow-advisory" : DEFAULT_FALLBACK_MODE,
		violations,
		approvalState: "validated",
		authoritativeMutationAllowed: false,
	};
};

export const canHandoffToDeterministicFlow = ({
	approvalState,
	decisionAllowed,
}: DeterministicHandoffGuardInput): boolean => {
	if (!decisionAllowed) {
		return false;
	}

	return approvalState === "approved";
};

export const scopeMatches = (
	left: TenantCompanyRucScope,
	right: TenantCompanyRucScope,
): boolean => {
	return (
		left.tenantId === right.tenantId &&
		left.organizationId === right.organizationId &&
		left.companyId === right.companyId &&
		left.ruc === right.ruc
	);
};
