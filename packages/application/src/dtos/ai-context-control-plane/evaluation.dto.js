import { z } from "zod";
export const CONTEXT_EVALUATION_STATES = {
    GREEN: "green",
    YELLOW: "yellow",
    RED: "red",
};
export const ContextEvaluationMetricSchema = z.object({
    metric: z.string().min(1),
    value: z.number(),
    window: z.string().min(1),
    target: z.number(),
    blocker: z.number(),
    unit: z.enum(["ratio", "count"]),
});
export const ContextEvaluationSummarySchema = z.object({
    state: z.enum([
        CONTEXT_EVALUATION_STATES.GREEN,
        CONTEXT_EVALUATION_STATES.YELLOW,
        CONTEXT_EVALUATION_STATES.RED,
    ]),
    metrics: z.array(ContextEvaluationMetricSchema),
    generatedAt: z.string().min(1),
    notes: z.array(z.string().min(1)).optional(),
});
//# sourceMappingURL=evaluation.dto.js.map