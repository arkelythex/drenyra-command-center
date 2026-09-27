/**
 * Local fiscal agent domain types for @drenyra/pi.
 *
 * These were extracted from @drenyra/fiscal-agent-domain during Command Center
 * ecosystem cleanup. They remain here temporarily until drenyra-ai becomes the
 * single source of truth for agent authority contracts.
 */
// Agent definition
export interface AgentCapability {
	id: string;
	description: string;
}
export interface AgentDefinition {
	id: string;
	name: string;
	description: string;
	riskTier: RiskTier;
	jurisdictions: Jurisdiction[];
	capabilities: AgentCapability[];
	forbiddenCapabilities: string[];
	approvalLevel: ApprovalLevel;
	parentId: string | null;
	maySpawn: readonly string[];
	isLeaf: boolean;
	sourcePath?: string;
}

// Delegation policy
export interface DelegationRule {
	parentId: string;
	childId: string;
	maxDepth: number;
	requiresApproval: boolean;
	inheritedContext: readonly string[];
	budgetLimit?: number;
}
export interface DelegationPolicy {
	rules: DelegationRule[];
	canDelegate(parentId: string, childId: string, depth: number): boolean;
	getRule(parentId: string, childId: string): DelegationRule | undefined;
	getLeaves(): DelegationRule[];
	getRoots(): DelegationRule[];
}

// Approval policy
export type ApprovalLevel = "R0" | "R1" | "R2" | "R3";
export const APPROVAL_LEVEL_ORDER: Record<ApprovalLevel, number> = {
	R0: 0,
	R1: 1,
	R2: 2,
	R3: 3,
};
export function compareApprovalLevel(a: ApprovalLevel, b: ApprovalLevel): number {
	return APPROVAL_LEVEL_ORDER[a] - APPROVAL_LEVEL_ORDER[b];
}
export function requiresHumanApproval(level: ApprovalLevel): boolean {
	return level === "R3";
}
export function requiresGovernanceBundle(level: ApprovalLevel): boolean {
	return level === "R2" || level === "R3";
}
export interface ApprovalRequirement {
	level: ApprovalLevel;
	allowedReviewers: readonly string[];
	requiresGovernanceBundle: boolean;
	requiresHumanApproval: boolean;
	requiredContext?: readonly string[];
}
export interface ApprovalPolicy {
	getRequirement(capabilityId: string): ApprovalRequirement;
	setRequirement(capabilityId: string, requirement: ApprovalRequirement): void;
}

// Risk tier
export type RiskTier = "R0" | "R1" | "R2" | "R3";
export type Jurisdiction = "PE" | "CL" | "CO" | "MX" | "AR" | "BR" | "GLOBAL" | string;

// Agent context
export interface AgentContext {
	tenantId: string;
	userId: string;
	organizationId: string;
	companyId: string;
	ruc: string;
	periodo?: string;
	traceId: string;
	parentSessionId?: string;
}
