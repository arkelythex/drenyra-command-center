import { z } from "zod";
import type { DeterministicFallbackDTO, TenantScope } from "./context-registry.dto";
import type { ContextWindowDTO } from "./context-run.dto";
export declare const CONTEXT_RETRIEVAL_MODES: {
    readonly MEMORY_ONLY: "memory-only";
    readonly MEMORY_AND_TOOLS: "memory-and-tools";
    readonly HYBRID_DOCUMENTARY: "hybrid-documentary";
};
export type ContextRetrievalMode = (typeof CONTEXT_RETRIEVAL_MODES)[keyof typeof CONTEXT_RETRIEVAL_MODES];
export declare const CONTEXT_APPROVAL_STATES: {
    readonly NOT_REQUIRED: "not-required";
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
};
export type ContextApprovalState = (typeof CONTEXT_APPROVAL_STATES)[keyof typeof CONTEXT_APPROVAL_STATES];
export declare const CONTEXT_POLICY_VIOLATION_CODES: {
    readonly UNKNOWN_SURFACE: "unknown-surface";
    readonly TOOL_NOT_ALLOWED: "tool-not-allowed";
    readonly CORPUS_NOT_ALLOWED: "corpus-not-allowed";
    readonly DOCUMENTARY_RAG_ONLY: "documentary-rag-only";
};
export type ContextPolicyViolationCode = (typeof CONTEXT_POLICY_VIOLATION_CODES)[keyof typeof CONTEXT_POLICY_VIOLATION_CODES];
export interface ContextPolicySelectionRequestDTO {
    surfaceId: string;
    tenantId: string;
    traceId?: string;
    requestedTools?: string[];
    requestedCorpora?: string[];
}
export interface ContextPolicyViolationDTO {
    code: ContextPolicyViolationCode;
    message: string;
    subject?: string;
}
export interface ContextPolicySelectionResponseDTO {
    traceId: string;
    surfaceId: string;
    tenantScope: TenantScope | null;
    allowed: boolean;
    retrievalMode: ContextRetrievalMode;
    approvalState: ContextApprovalState;
    allowedTools: string[];
    allowedCorpora: string[];
    contextWindow: ContextWindowDTO | null;
    deterministicFallback: DeterministicFallbackDTO | null;
    violations: ContextPolicyViolationDTO[];
}
export declare const ContextPolicySelectionRequestSchema: z.ZodObject<{
    surfaceId: z.ZodString;
    tenantId: z.ZodString;
    traceId: z.ZodOptional<z.ZodString>;
    requestedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requestedCorpora: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ContextPolicyViolationSchema: z.ZodObject<{
    code: z.ZodEnum<{
        "unknown-surface": "unknown-surface";
        "tool-not-allowed": "tool-not-allowed";
        "corpus-not-allowed": "corpus-not-allowed";
        "documentary-rag-only": "documentary-rag-only";
    }>;
    message: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ContextPolicySelectionResponseSchema: z.ZodObject<{
    traceId: z.ZodString;
    surfaceId: z.ZodString;
    tenantScope: z.ZodNullable<z.ZodString>;
    allowed: z.ZodBoolean;
    retrievalMode: z.ZodEnum<{
        "memory-only": "memory-only";
        "memory-and-tools": "memory-and-tools";
        "hybrid-documentary": "hybrid-documentary";
    }>;
    approvalState: z.ZodEnum<{
        "not-required": "not-required";
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>;
    allowedTools: z.ZodArray<z.ZodString>;
    allowedCorpora: z.ZodArray<z.ZodString>;
    contextWindow: z.ZodNullable<z.ZodObject<{
        maxMemoryItems: z.ZodNumber;
        maxDocumentResults: z.ZodNumber;
        maxToolCalls: z.ZodNumber;
    }, z.core.$strip>>;
    deterministicFallback: z.ZodNullable<z.ZodObject<{
        strategyId: z.ZodString;
        description: z.ZodString;
        owner: z.ZodString;
        evidenceSource: z.ZodString;
    }, z.core.$strip>>;
    violations: z.ZodArray<z.ZodObject<{
        code: z.ZodEnum<{
            "unknown-surface": "unknown-surface";
            "tool-not-allowed": "tool-not-allowed";
            "corpus-not-allowed": "corpus-not-allowed";
            "documentary-rag-only": "documentary-rag-only";
        }>;
        message: z.ZodString;
        subject: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=context-policy.dto.d.ts.map