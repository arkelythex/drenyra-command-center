import { z } from "zod";
export const FraudIndicatorDTOSchema = z.object({
    type: z.string(),
    severity: z.string(),
    description: z.string(),
    evidence: z.array(z.string()),
    detectedAt: z.string().datetime(),
});
export const CivicCaseStatusSchema = z.enum([
    "DRAFT",
    "ACTIVE",
    "COMPLETED",
    "ESCALATED",
    "RESOLVED",
]);
export const CivicCaseDTOSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: CivicCaseStatusSchema,
    electionIds: z.array(z.string()),
    fraudIndicators: z.array(FraudIndicatorDTOSchema),
    timeline: z.array(z.string()),
    escalationReason: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
//# sourceMappingURL=CivicCase.dto.js.map