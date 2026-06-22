import { z } from "zod";
import type { ContextApprovalState, ContextRetrievalMode } from "./context-policy.dto";
import type { ContextEvaluationSummaryDTO } from "./evaluation.dto";
export interface ContextWindowDTO {
    maxMemoryItems: number;
    maxDocumentResults: number;
    maxToolCalls: number;
}
export interface ContextRunRequestDTO {
    surfaceId: string;
    tenantId: string;
    traceId?: string;
    requestedTools?: string[];
    requestedCorpora?: string[];
    contextWindow?: ContextWindowDTO;
}
export interface ContextRunStateDTO {
    runId: string;
    traceId: string;
    surfaceId: string;
    approvalState: ContextApprovalState;
    retrievalMode: ContextRetrievalMode;
    contextWindow: ContextWindowDTO;
    evaluationSummary?: ContextEvaluationSummaryDTO | null;
}
export declare const ContextWindowSchema: z.ZodObject<{
    maxMemoryItems: z.ZodNumber;
    maxDocumentResults: z.ZodNumber;
    maxToolCalls: z.ZodNumber;
}, z.core.$strip>;
export declare const ContextRunRequestSchema: z.ZodObject<{
    surfaceId: z.ZodString;
    tenantId: z.ZodString;
    traceId: z.ZodOptional<z.ZodString>;
    requestedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requestedCorpora: z.ZodOptional<z.ZodArray<z.ZodString>>;
    contextWindow: z.ZodOptional<z.ZodObject<{
        maxMemoryItems: z.ZodNumber;
        maxDocumentResults: z.ZodNumber;
        maxToolCalls: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ContextRunStateSchema: z.ZodObject<{
    runId: z.ZodString;
    traceId: z.ZodString;
    surfaceId: z.ZodString;
    approvalState: z.ZodString;
    retrievalMode: z.ZodString;
    contextWindow: z.ZodObject<{
        maxMemoryItems: z.ZodNumber;
        maxDocumentResults: z.ZodNumber;
        maxToolCalls: z.ZodNumber;
    }, z.core.$strip>;
    evaluationSummary: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        state: z.ZodString;
        metrics: z.ZodArray<z.ZodObject<{
            metric: z.ZodString;
            value: z.ZodNumber;
            window: z.ZodString;
            target: z.ZodNumber;
            blocker: z.ZodNumber;
            unit: z.ZodString;
        }, z.core.$strip>>;
        generatedAt: z.ZodString;
        notes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
//# sourceMappingURL=context-run.dto.d.ts.map