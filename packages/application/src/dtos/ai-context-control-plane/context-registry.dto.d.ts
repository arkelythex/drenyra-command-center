import { z } from "zod";
import type { ContextRetrievalMode } from "./context-policy.dto";
import type { ContextWindowDTO } from "./context-run.dto";
export declare const TENANT_SCOPES: {
    readonly ORGANIZATION: "organization";
    readonly PORTFOLIO: "portfolio";
};
export type TenantScope = (typeof TENANT_SCOPES)[keyof typeof TENANT_SCOPES];
export declare const APPROVAL_REQUIREMENTS: {
    readonly SUPERVISOR: "supervisor";
    readonly FINANCIAL_CONTROLLER: "financial-controller";
};
export type ApprovalRequirement = (typeof APPROVAL_REQUIREMENTS)[keyof typeof APPROVAL_REQUIREMENTS];
export declare const CONTEXT_CORPUS_KINDS: {
    readonly DOCUMENTARY: "documentary";
};
export type ContextCorpusKind = (typeof CONTEXT_CORPUS_KINDS)[keyof typeof CONTEXT_CORPUS_KINDS];
export declare const CONTEXT_CORPUS_USAGES: {
    readonly RETRIEVAL: "retrieval";
};
export type ContextCorpusUsage = (typeof CONTEXT_CORPUS_USAGES)[keyof typeof CONTEXT_CORPUS_USAGES];
export interface ContextCorpusConstraintDTO {
    corpusId: string;
    label: string;
    kind: ContextCorpusKind;
    usage: ContextCorpusUsage;
    rationale: string;
    requiresApproval: boolean;
}
export interface DeterministicFallbackDTO {
    strategyId: string;
    description: string;
    owner: string;
    evidenceSource: string;
}
export interface ContextRegistrySurfaceDTO {
    surfaceId: string;
    jobId: string;
    title: string;
    description: string;
    tenantScope: TenantScope;
    approvalsRequired: ApprovalRequirement[];
    allowedTools: string[];
    allowedCorpora: ContextCorpusConstraintDTO[];
    retrievalDefault: ContextRetrievalMode;
    deterministicFallback: DeterministicFallbackDTO;
    contextWindow: ContextWindowDTO;
}
export declare const ContextCorpusConstraintSchema: z.ZodObject<{
    corpusId: z.ZodString;
    label: z.ZodString;
    kind: z.ZodEnum<{
        documentary: "documentary";
    }>;
    usage: z.ZodEnum<{
        retrieval: "retrieval";
    }>;
    rationale: z.ZodString;
    requiresApproval: z.ZodBoolean;
}, z.core.$strip>;
export declare const DeterministicFallbackSchema: z.ZodObject<{
    strategyId: z.ZodString;
    description: z.ZodString;
    owner: z.ZodString;
    evidenceSource: z.ZodString;
}, z.core.$strip>;
export declare const ContextRegistrySurfaceSchema: z.ZodObject<{
    surfaceId: z.ZodString;
    jobId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    tenantScope: z.ZodEnum<{
        organization: "organization";
        portfolio: "portfolio";
    }>;
    approvalsRequired: z.ZodArray<z.ZodEnum<{
        supervisor: "supervisor";
        "financial-controller": "financial-controller";
    }>>;
    allowedTools: z.ZodArray<z.ZodString>;
    allowedCorpora: z.ZodArray<z.ZodObject<{
        corpusId: z.ZodString;
        label: z.ZodString;
        kind: z.ZodEnum<{
            documentary: "documentary";
        }>;
        usage: z.ZodEnum<{
            retrieval: "retrieval";
        }>;
        rationale: z.ZodString;
        requiresApproval: z.ZodBoolean;
    }, z.core.$strip>>;
    retrievalDefault: z.ZodString;
    deterministicFallback: z.ZodObject<{
        strategyId: z.ZodString;
        description: z.ZodString;
        owner: z.ZodString;
        evidenceSource: z.ZodString;
    }, z.core.$strip>;
    contextWindow: z.ZodObject<{
        maxMemoryItems: z.ZodNumber;
        maxDocumentResults: z.ZodNumber;
        maxToolCalls: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=context-registry.dto.d.ts.map