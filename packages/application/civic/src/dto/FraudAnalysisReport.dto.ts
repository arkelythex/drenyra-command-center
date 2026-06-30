/**
 * FraudAnalysisReport DTO — Output of fraud pattern detection
 */
import { z } from "zod";
import { FraudIndicatorSchema } from "./ValidationResult.dto";

export const FraudIndicatorGroupSchema = z.object({
	type: z.string(),
	indicators: z.array(FraudIndicatorSchema),
});

export type FraudIndicatorGroupDTO = z.infer<typeof FraudIndicatorGroupSchema>;

export const FraudAnalysisSummarySchema = z.object({
	totalIndicators: z.number(),
	criticalCount: z.number(),
	highCount: z.number(),
	mediumCount: z.number(),
	lowCount: z.number(),
});

export type FraudAnalysisSummaryDTO = z.infer<
	typeof FraudAnalysisSummarySchema
>;

export const FraudAnalysisReportSchema = z.object({
	electionId: z.string(),
	analyzedAt: z.string().datetime(),
	analysisType: z.string(),
	indicators: z.array(FraudIndicatorSchema),
	summary: FraudAnalysisSummarySchema,
	groups: z.array(FraudIndicatorGroupSchema),
});

export type FraudAnalysisReportDTO = z.infer<typeof FraudAnalysisReportSchema>;
