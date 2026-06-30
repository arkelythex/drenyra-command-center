import { z } from "zod";
import { FraudIndicatorSchema } from "./ValidationResult.dto";
export const FraudIndicatorGroupSchema = z.object({
    type: z.string(),
    indicators: z.array(FraudIndicatorSchema),
});
export const FraudAnalysisSummarySchema = z.object({
    totalIndicators: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
});
export const FraudAnalysisReportSchema = z.object({
    electionId: z.string(),
    analyzedAt: z.string().datetime(),
    analysisType: z.string(),
    indicators: z.array(FraudIndicatorSchema),
    summary: FraudAnalysisSummarySchema,
    groups: z.array(FraudIndicatorGroupSchema),
});
//# sourceMappingURL=FraudAnalysisReport.dto.js.map