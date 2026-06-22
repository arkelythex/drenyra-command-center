import { z } from "zod";

const nonEmpty = z.string().min(1);
const payloadHash = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const TenantCompanyRucScopeSchema = z.object({
	tenantId: nonEmpty,
	organizationId: nonEmpty,
	companyId: nonEmpty,
	ruc: z.string().regex(/^\d{11}$/),
});

export const AgentCapabilitySchema = z.enum([
	"advisory.review",
	"advisory.explain",
	"advisory.classify",
	"advisory.route",
	"advisory.summarize",
]);

export const ApprovalClassSchema = z.enum([
	"not-required",
	"supervisor",
	"financial-controller",
]);

export const ToolRiskTierSchema = z.enum([
	"T0_READ_SAFE",
	"T1_READ_SENSITIVE",
	"T2_DRAFT_ONLY",
	"T3_MATERIAL_APPROVAL_REQUIRED",
	"T4_PROHIBITED_AUTONOMOUS",
]);

export const CurrencyCodeSchema = z.enum(["PEN", "USD"]);

export const ToolPolicyInputSchema = z.object({
	traceId: nonEmpty,
	tenantScope: TenantCompanyRucScopeSchema,
	userId: nonEmpty,
	role: z.enum(["operator", "supervisor", "financial-controller", "admin"]),
	tool: nonEmpty,
	action: nonEmpty,
	documentType: nonEmpty.optional(),
	amountMinorUnits: z.number().int().nonnegative().optional(),
	currency: CurrencyCodeSchema.optional(),
	sunatImpact: z.enum(["none", "draft", "material", "irreversible"]),
	evidenceRefs: z.array(nonEmpty),
	modelId: nonEmpty,
});

export const ValidatorResultSchema = z.object({
	validatorId: nonEmpty,
	status: z.enum(["pass", "fail", "not-applicable"]),
	evidenceRef: nonEmpty,
	reasonCode: nonEmpty.optional(),
});

export const ProposedActionSchema = z.object({
	actionId: nonEmpty,
	traceId: nonEmpty,
	tenantScope: TenantCompanyRucScopeSchema,
	tool: nonEmpty,
	action: nonEmpty,
	riskTier: ToolRiskTierSchema,
	payloadHash,
	evidenceRefs: z.array(nonEmpty).min(1),
	advisoryOnly: z.literal(true),
	authoritativeMutationAllowed: z.literal(false),
});

export const ApprovalLeaseSchema = z.object({
	approvalId: nonEmpty,
	traceId: nonEmpty,
	tenantScope: TenantCompanyRucScopeSchema,
	userId: nonEmpty,
	reviewerId: nonEmpty,
	reviewerRole: z.enum(["supervisor", "financial-controller"]),
	tool: nonEmpty,
	action: nonEmpty,
	payloadHash,
	evidenceRefs: z.array(nonEmpty).min(1),
	validatorResults: z.array(ValidatorResultSchema).min(1),
	riskTier: z.literal("T3_MATERIAL_APPROVAL_REQUIRED"),
	expiresAt: z.iso.datetime(),
});

export const SupportedSurfaceSchema = z.enum(["api", "workspace", "batch"]);

export const AgentRegistryEntrySchema = z.object({
	agentId: nonEmpty,
	purpose: nonEmpty,
	tenantScope: TenantCompanyRucScopeSchema,
	capabilities: z.array(AgentCapabilitySchema).min(1),
	allowedTools: z
		.array(nonEmpty)
		.refine(
			(tools) => tools.every((tool) => tool !== "*"),
			"Wildcard tool access is forbidden (deny-by-default)",
		),
	approvalClass: ApprovalClassSchema,
	supportedSurfaces: z.array(SupportedSurfaceSchema).min(1),
});

export const PolicyDecisionSchema = z.object({
	traceId: nonEmpty,
	tenantScope: TenantCompanyRucScopeSchema,
	allowed: z.boolean(),
	fallbackMode: z.enum(["deterministic-required", "deny", "allow-advisory"]),
	violations: z.array(nonEmpty),
	approvalState: z.enum(["proposed", "validated", "approved", "rejected"]),
	authoritativeMutationAllowed: z.literal(false),
});

export const ApprovalEnvelopeSchema = z
	.object({
		approvalId: nonEmpty,
		traceId: nonEmpty,
		state: z.enum(["proposed", "validated", "approved", "rejected"]),
		requiresHumanApproval: z.boolean(),
		reviewerRole: z.enum(["supervisor", "financial-controller"]),
		requestedAction: z.enum([
			"request-approval",
			"reject",
			"apply-deterministic-command",
		]),
	})
	.refine(
		(value) =>
			value.requestedAction !== "apply-deterministic-command" ||
			value.state === "approved",
		"deterministic apply requires approved state",
	);

export const TraceBundleSchema = z
	.object({
		traceId: nonEmpty,
		tenantScope: TenantCompanyRucScopeSchema,
		toolCalls: z.array(nonEmpty),
		sourceRefs: z.array(nonEmpty),
		outputHash: nonEmpty,
		redactionApplied: z.literal(true),
		containsRawPii: z.literal(false),
	})
	.refine((value) => value.redactionApplied && !value.containsRawPii, {
		message: "trace bundle must be redacted and PII-safe",
	});

export const SuggestionEnvelopeSchema = z.object({
	suggestionId: nonEmpty,
	traceId: nonEmpty,
	summary: nonEmpty,
	recommendedAction: z.enum([
		"request-approval",
		"request-more-context",
		"reject",
	]),
	advisoryOnly: z.literal(true),
	authoritativeMutationProhibited: z.literal(true),
});

export const WorkflowPlanSchema = z.object({
	workflowId: nonEmpty,
	intent: nonEmpty,
	tenantScope: TenantCompanyRucScopeSchema,
	steps: z.array(nonEmpty).min(1),
	deterministicCheckpointIds: z.array(nonEmpty),
});

export const SandboxExecutionRequestSchema = z.object({
	executionId: nonEmpty,
	payloadRef: nonEmpty,
	allowedRepositories: z.array(nonEmpty),
	allowedTools: z.array(nonEmpty),
	ttlSeconds: z.number().int().positive(),
	noProductionSecrets: z.literal(true),
});

// ============================================================================
// AI Control Plane — New Schemas for Phase 1 Foundation
// ============================================================================

/**
 * Compact risk tier enum matching DB storage (T0–T4).
 */
export const RiskTierSchema = z.enum(["T0", "T1", "T2", "T3", "T4"]);

/**
 * Partial scope for querying — all fields optional.
 */
export const ToolScopeSchema = z.object({
	tenantId: z.string().optional(),
	organizationId: z.string().optional(),
	companyId: z.string().optional(),
	ruc: z.string().optional(),
});

/**
 * Input required to register a new tool.
 *
 * Accepts raw JSON Schema as `inputSchema` (backward compat) OR
 * a Zod schema via `zodSchema` for auto-conversion. When both are
 * provided, `zodSchema` takes precedence.
 */
export const ToolRegistrationSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	riskTier: RiskTierSchema,
	inputSchema: z.record(z.string(), z.unknown()).optional(),
	outputSchema: z.record(z.string(), z.unknown()).optional(),
	/**
	 * Zod schema for auto-conversion to JSON Schema via `zodToolSchema()`.
	 * Runtime validation checks for `.constructor.name === "ZodObject"`
	 * at registration time — not statically typed due to Zod v4's
	 * complex type hierarchy.
	 */
	zodSchema: z.any().optional(),
	requiresApproval: z.boolean().optional().default(false),
	fiscalImpact: z.boolean().optional().default(false),
	approvalLevel: z
		.enum(["auto", "notify", "gate", "fiscal_gate"])
		.optional()
		.default("auto"),
});

/**
 * Complete tool definition as stored and returned from the registry.
 */
export const ToolDefinitionSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable().optional(),
	riskTier: RiskTierSchema,
	inputSchema: z.record(z.string(), z.unknown()).nullable().optional(),
	outputSchema: z.record(z.string(), z.unknown()).nullable().optional(),
	requiresApproval: z.boolean(),
	fiscalImpact: z.boolean(),
	approvalLevel: z.string().nullable().optional(),
	metadata: z.record(z.string(), z.unknown()).nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Input to the policy engine evaluation.
 */
export const PolicyEvaluationInputSchema = z.object({
	traceId: z.string().min(1),
	agentId: z.string().min(1),
	toolName: z.string().min(1),
	tenantScope: TenantCompanyRucScopeSchema,
	input: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Result bundle from the governance/approval gate.
 */
export const GovernanceBundleResultSchema = z.object({
	traceId: z.string().min(1),
	agentId: z.string().min(1),
	toolName: z.string(),
	allowed: z.boolean(),
	riskTier: RiskTierSchema,
	requiresApproval: z.boolean(),
	approvalState: z
		.enum(["proposed", "validated", "approved", "rejected"])
		.default("validated"),
	violations: z.array(z.string()).default([]),
	evidenceRefs: z.array(z.string()).default([]),
	fiscalPolicy: z.unknown().optional(),
});

export type TenantCompanyRucScope = z.infer<typeof TenantCompanyRucScopeSchema>;
export type ToolRiskTier = z.infer<typeof ToolRiskTierSchema>;
export type ToolPolicyInput = z.infer<typeof ToolPolicyInputSchema>;
export type ValidatorResult = z.infer<typeof ValidatorResultSchema>;
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type ApprovalLease = z.infer<typeof ApprovalLeaseSchema>;
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type AgentRegistryEntry = z.infer<typeof AgentRegistryEntrySchema>;
export type WorkflowPlan = z.infer<typeof WorkflowPlanSchema>;
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
export type ApprovalState = z.infer<typeof ApprovalEnvelopeSchema.shape.state>;
export type ApprovalEnvelope = z.infer<typeof ApprovalEnvelopeSchema>;
export type TraceBundle = z.infer<typeof TraceBundleSchema>;
export type SuggestionEnvelope = z.infer<typeof SuggestionEnvelopeSchema>;
export type SandboxExecutionRequest = z.infer<
	typeof SandboxExecutionRequestSchema
>;
export type ToolScope = z.infer<typeof ToolScopeSchema>;
export type RiskTier = z.infer<typeof RiskTierSchema>;
export type ToolRegistration = z.infer<typeof ToolRegistrationSchema>;
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type PolicyEvaluationInput = z.infer<typeof PolicyEvaluationInputSchema>;
export type GovernanceBundleResult = z.infer<
	typeof GovernanceBundleResultSchema
>;

// ============================================================================
// Granular Permission Types (P5)
// ============================================================================

/**
 * Tri-state permission decision for a tool.
 * - ALLOW: tool executes without approval gate
 * - DENY: tool is blocked entirely
 * - REQUIRE_APPROVAL: tool needs human approval before execution
 */
export type PermissionEffect = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";

/**
 * Result of a permission check — what canExecute() returns.
 */
export interface PermissionResult {
	effect: PermissionEffect;
	source: "permission_entry" | "default";
	reason?: string;
}

/**
 * Scope and session context for permission lookups.
 */
export interface PermissionContext {
	companyId?: string;
	organizationId?: string;
	userId?: string;
}

/**
 * DB row shape for ai_tool_permissions.
 */
export interface PermissionEntry {
	id: string;
	toolName: string;
	effect: PermissionEffect;
	companyId?: string | null;
	organizationId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input for tool-level policy evaluation.
 */
export interface ToolActionInput {
	traceId: string;
	agentId: string;
	toolName: string;
	input: unknown;
	context: {
		tenantId: string;
		organizationId: string;
		companyId: string;
		ruc: string;
		userId: string;
		sessionId?: string;
		traceId: string;
	};
	action: "read" | "write" | "execute" | "admin";
}
