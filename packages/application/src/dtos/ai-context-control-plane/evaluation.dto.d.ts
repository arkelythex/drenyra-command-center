import { z } from "zod";
export declare const CONTEXT_EVALUATION_STATES: {
	readonly GREEN: "green";
	readonly YELLOW: "yellow";
	readonly RED: "red";
};
export type ContextEvaluationState =
	(typeof CONTEXT_EVALUATION_STATES)[keyof typeof CONTEXT_EVALUATION_STATES];
export interface ContextEvaluationMetricDTO {
	metric: string;
	value: number;
	window: string;
	target: number;
	blocker: number;
	unit: "ratio" | "count";
}
export interface ContextEvaluationSummaryDTO {
	state: ContextEvaluationState;
	metrics: ContextEvaluationMetricDTO[];
	generatedAt: string;
	notes?: string[];
}
export declare const ContextEvaluationMetricSchema: z.ZodObject<
	{
		metric: z.ZodString;
		value: z.ZodNumber;
		window: z.ZodString;
		target: z.ZodNumber;
		blocker: z.ZodNumber;
		unit: z.ZodEnum<{
			ratio: "ratio";
			count: "count";
		}>;
	},
	z.core.$strip
>;
export declare const ContextEvaluationSummarySchema: z.ZodObject<
	{
		state: z.ZodEnum<{
			green: "green";
			yellow: "yellow";
			red: "red";
		}>;
		metrics: z.ZodArray<
			z.ZodObject<
				{
					metric: z.ZodString;
					value: z.ZodNumber;
					window: z.ZodString;
					target: z.ZodNumber;
					blocker: z.ZodNumber;
					unit: z.ZodEnum<{
						ratio: "ratio";
						count: "count";
					}>;
				},
				z.core.$strip
			>
		>;
		generatedAt: z.ZodString;
		notes: z.ZodOptional<z.ZodArray<z.ZodString>>;
	},
	z.core.$strip
>;
//# sourceMappingURL=evaluation.dto.d.ts.map
