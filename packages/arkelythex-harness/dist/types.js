import { z } from "zod";
export const HarnessStatusSchema = z.enum(["done", "blocked", "partial", "pending_approval"]);
export const HarnessExecutionContextSchema = z.object({
    sessionId: z.string(),
    organizationId: z.string(),
    companyId: z.string(),
    companyRuc: z.string(),
    period: z.string(),
    traceId: z.string(),
    userId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const HarnessSpawnRequestSchema = z.object({
    agentId: z.string(),
    task: z.string().min(1),
    context: HarnessExecutionContextSchema,
    parentRunId: z.string().optional(),
    depth: z.number().int().min(0).optional(),
});
export const HarnessSpawnChildSchema = z.object({
    agentId: z.string(),
    task: z.string(),
});
export const HarnessAgentResultSchema = z.object({
    status: HarnessStatusSchema,
    executiveSummary: z.string(),
    artifacts: z.array(z.string()).default([]),
    nextRecommended: z.string(),
    risks: z.array(z.string()).default([]),
    delegationDepth: z.number().int(),
    spawn: z.array(HarnessSpawnChildSchema).optional(),
    requiresApproval: z.boolean().optional(),
});
export const HarnessRunNodeSchema = z.lazy(() => z.object({
    runId: z.string(),
    agentId: z.string(),
    depth: z.number().int(),
    status: HarnessStatusSchema,
    result: HarnessAgentResultSchema,
    children: z.array(HarnessRunNodeSchema),
    startedAt: z.string(),
    endedAt: z.string(),
}));
export const HarnessExecuteRequestSchema = z.object({
    task: z.string().min(1),
    context: HarnessExecutionContextSchema,
    rootAgentId: z.string().optional(),
    autoSpawn: z.boolean().default(true),
});
//# sourceMappingURL=types.js.map