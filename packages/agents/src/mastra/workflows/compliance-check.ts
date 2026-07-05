import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const complianceCheckWorkflow = createWorkflow({
	id: "compliance-check",
	inputSchema: z.object({
		task: z.object({
			id: z.string(),
			type: z.string(),
			payload: z.record(z.string(), z.unknown()).optional(),
			metadata: z.record(z.string(), z.unknown()).optional(),
		}),
	}),
	outputSchema: z.object({
		result: z.unknown(),
	}),
});

export { complianceCheckWorkflow };
