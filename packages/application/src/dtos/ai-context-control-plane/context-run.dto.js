import { z } from "zod";
export const ContextWindowSchema = z.object({
	maxMemoryItems: z.number().int().positive(),
	maxDocumentResults: z.number().int().nonnegative(),
	maxToolCalls: z.number().int().positive(),
});
export const ContextRunRequestSchema = z.object({
	surfaceId: z.string().min(1),
	tenantId: z.string().min(1),
	traceId: z.string().min(1).optional(),
	requestedTools: z.array(z.string().min(1)).optional(),
	requestedCorpora: z.array(z.string().min(1)).optional(),
	contextWindow: ContextWindowSchema.optional(),
});
export const ContextRunStateSchema = z.object({
	runId: z.string().min(1),
	traceId: z.string().min(1),
	surfaceId: z.string().min(1),
	approvalState: z.string().min(1),
	retrievalMode: z.string().min(1),
	contextWindow: ContextWindowSchema,
	evaluationSummary: z
		.object({
			state: z.string().min(1),
			metrics: z.array(
				z.object({
					metric: z.string().min(1),
					value: z.number(),
					window: z.string().min(1),
					target: z.number(),
					blocker: z.number(),
					unit: z.string().min(1),
				}),
			),
			generatedAt: z.string().min(1),
			notes: z.array(z.string().min(1)).optional(),
		})
		.nullable()
		.optional(),
});
//# sourceMappingURL=context-run.dto.js.map
