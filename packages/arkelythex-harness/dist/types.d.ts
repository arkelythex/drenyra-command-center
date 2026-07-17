import { z } from "zod";
export declare const HarnessStatusSchema: z.ZodEnum<{
    done: "done";
    blocked: "blocked";
    partial: "partial";
    pending_approval: "pending_approval";
}>;
export type HarnessStatus = z.infer<typeof HarnessStatusSchema>;
export declare const HarnessExecutionContextSchema: z.ZodObject<{
    sessionId: z.ZodString;
    organizationId: z.ZodString;
    companyId: z.ZodString;
    companyRuc: z.ZodString;
    period: z.ZodString;
    traceId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type HarnessExecutionContext = z.infer<typeof HarnessExecutionContextSchema>;
export declare const HarnessSpawnRequestSchema: z.ZodObject<{
    agentId: z.ZodString;
    task: z.ZodString;
    context: z.ZodObject<{
        sessionId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        companyRuc: z.ZodString;
        period: z.ZodString;
        traceId: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>;
    parentRunId: z.ZodOptional<z.ZodString>;
    depth: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type HarnessSpawnRequest = z.infer<typeof HarnessSpawnRequestSchema>;
export declare const HarnessSpawnChildSchema: z.ZodObject<{
    agentId: z.ZodString;
    task: z.ZodString;
}, z.core.$strip>;
export type HarnessSpawnChild = z.infer<typeof HarnessSpawnChildSchema>;
export declare const HarnessAgentResultSchema: z.ZodObject<{
    status: z.ZodEnum<{
        done: "done";
        blocked: "blocked";
        partial: "partial";
        pending_approval: "pending_approval";
    }>;
    executiveSummary: z.ZodString;
    artifacts: z.ZodDefault<z.ZodArray<z.ZodString>>;
    nextRecommended: z.ZodString;
    risks: z.ZodDefault<z.ZodArray<z.ZodString>>;
    delegationDepth: z.ZodNumber;
    spawn: z.ZodOptional<z.ZodArray<z.ZodObject<{
        agentId: z.ZodString;
        task: z.ZodString;
    }, z.core.$strip>>>;
    requiresApproval: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type HarnessAgentResult = z.infer<typeof HarnessAgentResultSchema>;
export interface HarnessRunNode {
    runId: string;
    agentId: string;
    depth: number;
    status: HarnessStatus;
    result: HarnessAgentResult;
    children: HarnessRunNode[];
    startedAt: string;
    endedAt: string;
}
export declare const HarnessRunNodeSchema: z.ZodType<HarnessRunNode>;
export declare const HarnessExecuteRequestSchema: z.ZodObject<{
    task: z.ZodString;
    context: z.ZodObject<{
        sessionId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        companyRuc: z.ZodString;
        period: z.ZodString;
        traceId: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>;
    rootAgentId: z.ZodOptional<z.ZodString>;
    autoSpawn: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type HarnessExecuteRequest = z.infer<typeof HarnessExecuteRequestSchema>;
export interface HarnessExecuteResponse {
    traceId: string;
    rootAgentId: string;
    status: HarnessStatus;
    tree: HarnessRunNode;
    executiveSummary: string;
}
export type AgentHandler = (input: HarnessSpawnRequest & {
    runId: string;
}) => Promise<HarnessAgentResult>;
export interface HarnessOptions {
    maxDepth?: number;
    handlers?: Map<string, AgentHandler>;
    onApprovalRequired?: (input: {
        agentId: string;
        task: string;
        context: HarnessExecutionContext;
        runId: string;
    }) => Promise<boolean>;
}
//# sourceMappingURL=types.d.ts.map