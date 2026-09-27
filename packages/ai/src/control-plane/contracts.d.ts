import { z } from "zod";
export declare const TenantCompanyRucScopeSchema: z.ZodObject<{
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    companyId: z.ZodString;
    ruc: z.ZodString;
}, z.core.$strip>;
export declare const AgentCapabilitySchema: z.ZodEnum<{
    "advisory.review": "advisory.review";
    "advisory.explain": "advisory.explain";
    "advisory.classify": "advisory.classify";
    "advisory.route": "advisory.route";
    "advisory.summarize": "advisory.summarize";
}>;
export declare const ApprovalClassSchema: z.ZodEnum<{
    "not-required": "not-required";
    supervisor: "supervisor";
    "financial-controller": "financial-controller";
}>;
export declare const ToolRiskTierSchema: z.ZodEnum<{
    T0_READ_SAFE: "T0_READ_SAFE";
    T1_READ_SENSITIVE: "T1_READ_SENSITIVE";
    T2_DRAFT_ONLY: "T2_DRAFT_ONLY";
    T3_MATERIAL_APPROVAL_REQUIRED: "T3_MATERIAL_APPROVAL_REQUIRED";
    T4_PROHIBITED_AUTONOMOUS: "T4_PROHIBITED_AUTONOMOUS";
}>;
export declare const CurrencyCodeSchema: z.ZodEnum<{
    PEN: "PEN";
    USD: "USD";
}>;
export declare const ToolPolicyInputSchema: z.ZodObject<{
    traceId: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    userId: z.ZodString;
    role: z.ZodEnum<{
        supervisor: "supervisor";
        "financial-controller": "financial-controller";
        admin: "admin";
        operator: "operator";
    }>;
    tool: z.ZodString;
    action: z.ZodString;
    documentType: z.ZodOptional<z.ZodString>;
    amountMinorUnits: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodEnum<{
        PEN: "PEN";
        USD: "USD";
    }>>;
    sunatImpact: z.ZodEnum<{
        draft: "draft";
        none: "none";
        material: "material";
        irreversible: "irreversible";
    }>;
    evidenceRefs: z.ZodArray<z.ZodString>;
    modelId: z.ZodString;
}, z.core.$strip>;
export declare const ValidatorResultSchema: z.ZodObject<{
    validatorId: z.ZodString;
    status: z.ZodEnum<{
        pass: "pass";
        fail: "fail";
        "not-applicable": "not-applicable";
    }>;
    evidenceRef: z.ZodString;
    reasonCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ProposedActionSchema: z.ZodObject<{
    actionId: z.ZodString;
    traceId: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    tool: z.ZodString;
    action: z.ZodString;
    riskTier: z.ZodEnum<{
        T0_READ_SAFE: "T0_READ_SAFE";
        T1_READ_SENSITIVE: "T1_READ_SENSITIVE";
        T2_DRAFT_ONLY: "T2_DRAFT_ONLY";
        T3_MATERIAL_APPROVAL_REQUIRED: "T3_MATERIAL_APPROVAL_REQUIRED";
        T4_PROHIBITED_AUTONOMOUS: "T4_PROHIBITED_AUTONOMOUS";
    }>;
    payloadHash: z.ZodString;
    evidenceRefs: z.ZodArray<z.ZodString>;
    advisoryOnly: z.ZodLiteral<true>;
    authoritativeMutationAllowed: z.ZodLiteral<false>;
}, z.core.$strip>;
export declare const ApprovalLeaseSchema: z.ZodObject<{
    approvalId: z.ZodString;
    traceId: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    userId: z.ZodString;
    reviewerId: z.ZodString;
    reviewerRole: z.ZodEnum<{
        supervisor: "supervisor";
        "financial-controller": "financial-controller";
    }>;
    tool: z.ZodString;
    action: z.ZodString;
    payloadHash: z.ZodString;
    evidenceRefs: z.ZodArray<z.ZodString>;
    validatorResults: z.ZodArray<z.ZodObject<{
        validatorId: z.ZodString;
        status: z.ZodEnum<{
            pass: "pass";
            fail: "fail";
            "not-applicable": "not-applicable";
        }>;
        evidenceRef: z.ZodString;
        reasonCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    riskTier: z.ZodLiteral<"T3_MATERIAL_APPROVAL_REQUIRED">;
    expiresAt: z.ZodISODateTime;
}, z.core.$strip>;
export declare const SupportedSurfaceSchema: z.ZodEnum<{
    api: "api";
    workspace: "workspace";
    batch: "batch";
}>;
export declare const AgentRegistryEntrySchema: z.ZodObject<{
    agentId: z.ZodString;
    purpose: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    capabilities: z.ZodArray<z.ZodEnum<{
        "advisory.review": "advisory.review";
        "advisory.explain": "advisory.explain";
        "advisory.classify": "advisory.classify";
        "advisory.route": "advisory.route";
        "advisory.summarize": "advisory.summarize";
    }>>;
    allowedTools: z.ZodArray<z.ZodString>;
    approvalClass: z.ZodEnum<{
        "not-required": "not-required";
        supervisor: "supervisor";
        "financial-controller": "financial-controller";
    }>;
    supportedSurfaces: z.ZodArray<z.ZodEnum<{
        api: "api";
        workspace: "workspace";
        batch: "batch";
    }>>;
}, z.core.$strip>;
export declare const PolicyDecisionSchema: z.ZodObject<{
    traceId: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    allowed: z.ZodBoolean;
    fallbackMode: z.ZodEnum<{
        deny: "deny";
        "deterministic-required": "deterministic-required";
        "allow-advisory": "allow-advisory";
    }>;
    violations: z.ZodArray<z.ZodString>;
    approvalState: z.ZodEnum<{
        approved: "approved";
        rejected: "rejected";
        proposed: "proposed";
        validated: "validated";
    }>;
    authoritativeMutationAllowed: z.ZodLiteral<false>;
}, z.core.$strip>;
export declare const ApprovalEnvelopeSchema: z.ZodObject<{
    approvalId: z.ZodString;
    traceId: z.ZodString;
    state: z.ZodEnum<{
        approved: "approved";
        rejected: "rejected";
        proposed: "proposed";
        validated: "validated";
    }>;
    requiresHumanApproval: z.ZodBoolean;
    reviewerRole: z.ZodEnum<{
        supervisor: "supervisor";
        "financial-controller": "financial-controller";
    }>;
    requestedAction: z.ZodEnum<{
        "request-approval": "request-approval";
        reject: "reject";
        "apply-deterministic-command": "apply-deterministic-command";
    }>;
}, z.core.$strip>;
export declare const TraceBundleSchema: z.ZodObject<{
    traceId: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    toolCalls: z.ZodArray<z.ZodString>;
    sourceRefs: z.ZodArray<z.ZodString>;
    outputHash: z.ZodString;
    redactionApplied: z.ZodLiteral<true>;
    containsRawPii: z.ZodLiteral<false>;
}, z.core.$strip>;
export declare const SuggestionEnvelopeSchema: z.ZodObject<{
    suggestionId: z.ZodString;
    traceId: z.ZodString;
    summary: z.ZodString;
    recommendedAction: z.ZodEnum<{
        "request-approval": "request-approval";
        reject: "reject";
        "request-more-context": "request-more-context";
    }>;
    advisoryOnly: z.ZodLiteral<true>;
    authoritativeMutationProhibited: z.ZodLiteral<true>;
}, z.core.$strip>;
export declare const WorkflowPlanSchema: z.ZodObject<{
    workflowId: z.ZodString;
    intent: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    steps: z.ZodArray<z.ZodString>;
    deterministicCheckpointIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const SandboxExecutionRequestSchema: z.ZodObject<{
    executionId: z.ZodString;
    payloadRef: z.ZodString;
    allowedRepositories: z.ZodArray<z.ZodString>;
    allowedTools: z.ZodArray<z.ZodString>;
    ttlSeconds: z.ZodNumber;
    noProductionSecrets: z.ZodLiteral<true>;
}, z.core.$strip>;
export declare const RiskTierSchema: z.ZodEnum<{
    T0: "T0";
    T1: "T1";
    T2: "T2";
    T3: "T3";
    T4: "T4";
}>;
export declare const ToolScopeSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    companyId: z.ZodOptional<z.ZodString>;
    ruc: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ToolRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    riskTier: z.ZodEnum<{
        T0: "T0";
        T1: "T1";
        T2: "T2";
        T3: "T3";
        T4: "T4";
    }>;
    inputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    outputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    zodSchema: z.ZodOptional<z.ZodAny>;
    requiresApproval: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    fiscalImpact: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    approvalLevel: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        gate: "gate";
        notify: "notify";
        fiscal_gate: "fiscal_gate";
    }>>>;
}, z.core.$strip>;
export declare const ToolDefinitionSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    riskTier: z.ZodEnum<{
        T0: "T0";
        T1: "T1";
        T2: "T2";
        T3: "T3";
        T4: "T4";
    }>;
    inputSchema: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    outputSchema: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    requiresApproval: z.ZodBoolean;
    fiscalImpact: z.ZodBoolean;
    approvalLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const PolicyEvaluationInputSchema: z.ZodObject<{
    traceId: z.ZodString;
    agentId: z.ZodString;
    toolName: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const GovernanceBundleResultSchema: z.ZodObject<{
    traceId: z.ZodString;
    agentId: z.ZodString;
    toolName: z.ZodString;
    allowed: z.ZodBoolean;
    riskTier: z.ZodEnum<{
        T0: "T0";
        T1: "T1";
        T2: "T2";
        T3: "T3";
        T4: "T4";
    }>;
    requiresApproval: z.ZodBoolean;
    approvalState: z.ZodDefault<z.ZodEnum<{
        approved: "approved";
        rejected: "rejected";
        proposed: "proposed";
        validated: "validated";
    }>>;
    violations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    evidenceRefs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    fiscalPolicy: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strip>;
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
export type SandboxExecutionRequest = z.infer<typeof SandboxExecutionRequestSchema>;
export type ToolScope = z.infer<typeof ToolScopeSchema>;
export type RiskTier = z.infer<typeof RiskTierSchema>;
export type ToolRegistration = z.infer<typeof ToolRegistrationSchema>;
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type PolicyEvaluationInput = z.infer<typeof PolicyEvaluationInputSchema>;
export type GovernanceBundleResult = z.infer<typeof GovernanceBundleResultSchema>;
export type PermissionEffect = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
export interface PermissionResult {
    effect: PermissionEffect;
    source: "permission_entry" | "default";
    reason?: string;
}
export interface PermissionContext {
    companyId?: string;
    organizationId?: string;
    userId?: string;
}
export interface PermissionEntry {
    id: string;
    toolName: string;
    effect: PermissionEffect;
    companyId?: string | null;
    organizationId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
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
//# sourceMappingURL=contracts.d.ts.map