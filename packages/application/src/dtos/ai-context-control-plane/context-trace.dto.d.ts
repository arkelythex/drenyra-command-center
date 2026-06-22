import { z } from "zod";
export declare const CONTEXT_TRACE_EVENT_TYPES: {
    readonly POLICY_RESOLVED: "policy-resolved";
    readonly EVALUATION_RECORDED: "evaluation-recorded";
    readonly APPROVAL_CHECKPOINT: "approval-checkpoint";
};
export type ContextTraceEventType = (typeof CONTEXT_TRACE_EVENT_TYPES)[keyof typeof CONTEXT_TRACE_EVENT_TYPES];
export interface ContextTraceAttributesDTO {
    traceId: string;
    runId: string;
    surfaceId: string;
    tenantId: string;
    organizationId?: number | null;
    retrievalMode?: string;
    approvalState?: string;
    evaluationState?: string;
    requestedTools?: string[];
    requestedCorpora?: string[];
}
export interface ContextTraceRecordDTO {
    eventType: ContextTraceEventType;
    traceId: string;
    occurredAt: string;
    summary: string;
    piiRedacted: boolean;
    attributes: ContextTraceAttributesDTO;
}
export declare const ContextTraceAttributesSchema: z.ZodObject<{
    traceId: z.ZodString;
    runId: z.ZodString;
    surfaceId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    retrievalMode: z.ZodOptional<z.ZodEnum<{
        "memory-only": "memory-only";
        "memory-and-tools": "memory-and-tools";
        "hybrid-documentary": "hybrid-documentary";
    }>>;
    approvalState: z.ZodOptional<z.ZodEnum<{
        "not-required": "not-required";
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>>;
    evaluationState: z.ZodOptional<z.ZodEnum<{
        green: "green";
        yellow: "yellow";
        red: "red";
    }>>;
    requestedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requestedCorpora: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ContextTraceRecordSchema: z.ZodObject<{
    eventType: z.ZodEnum<{
        "policy-resolved": "policy-resolved";
        "evaluation-recorded": "evaluation-recorded";
        "approval-checkpoint": "approval-checkpoint";
    }>;
    traceId: z.ZodString;
    occurredAt: z.ZodString;
    summary: z.ZodString;
    piiRedacted: z.ZodBoolean;
    attributes: z.ZodObject<{
        traceId: z.ZodString;
        runId: z.ZodString;
        surfaceId: z.ZodString;
        tenantId: z.ZodString;
        organizationId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        retrievalMode: z.ZodOptional<z.ZodEnum<{
            "memory-only": "memory-only";
            "memory-and-tools": "memory-and-tools";
            "hybrid-documentary": "hybrid-documentary";
        }>>;
        approvalState: z.ZodOptional<z.ZodEnum<{
            "not-required": "not-required";
            pending: "pending";
            approved: "approved";
            rejected: "rejected";
        }>>;
        evaluationState: z.ZodOptional<z.ZodEnum<{
            green: "green";
            yellow: "yellow";
            red: "red";
        }>>;
        requestedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requestedCorpora: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=context-trace.dto.d.ts.map