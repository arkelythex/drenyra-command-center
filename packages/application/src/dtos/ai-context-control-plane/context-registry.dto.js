import { z } from "zod";
export const TENANT_SCOPES = {
    ORGANIZATION: "organization",
    PORTFOLIO: "portfolio",
};
export const APPROVAL_REQUIREMENTS = {
    SUPERVISOR: "supervisor",
    FINANCIAL_CONTROLLER: "financial-controller",
};
export const CONTEXT_CORPUS_KINDS = {
    DOCUMENTARY: "documentary",
};
export const CONTEXT_CORPUS_USAGES = {
    RETRIEVAL: "retrieval",
};
export const ContextCorpusConstraintSchema = z.object({
    corpusId: z.string().min(1),
    label: z.string().min(1),
    kind: z.enum([CONTEXT_CORPUS_KINDS.DOCUMENTARY]),
    usage: z.enum([CONTEXT_CORPUS_USAGES.RETRIEVAL]),
    rationale: z.string().min(1),
    requiresApproval: z.boolean(),
});
export const DeterministicFallbackSchema = z.object({
    strategyId: z.string().min(1),
    description: z.string().min(1),
    owner: z.string().min(1),
    evidenceSource: z.string().min(1),
});
export const ContextRegistrySurfaceSchema = z.object({
    surfaceId: z.string().min(1),
    jobId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    tenantScope: z.enum([TENANT_SCOPES.ORGANIZATION, TENANT_SCOPES.PORTFOLIO]),
    approvalsRequired: z.array(z.enum([
        APPROVAL_REQUIREMENTS.SUPERVISOR,
        APPROVAL_REQUIREMENTS.FINANCIAL_CONTROLLER,
    ])),
    allowedTools: z.array(z.string().min(1)),
    allowedCorpora: z.array(ContextCorpusConstraintSchema),
    retrievalDefault: z.string().min(1),
    deterministicFallback: DeterministicFallbackSchema,
    contextWindow: z.object({
        maxMemoryItems: z.number().int().positive(),
        maxDocumentResults: z.number().int().nonnegative(),
        maxToolCalls: z.number().int().positive(),
    }),
});
//# sourceMappingURL=context-registry.dto.js.map