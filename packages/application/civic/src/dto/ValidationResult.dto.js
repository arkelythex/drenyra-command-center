import { z } from "zod";
export const ValidationOutcomeSchema = z.enum([
    "approved",
    "rejected",
    "needs-review",
]);
export const FraudIndicatorSchema = z.object({
    type: z.string(),
    severity: z.string(),
    description: z.string(),
    evidence: z.array(z.string()),
    detectedAt: z.string().datetime(),
});
export const EvidenceInputSchema = z.object({
    hash: z.string(),
    type: z.string(),
    content: z.string().optional(),
});
export const VoterVerificationSchema = z.object({
    dni: z.string(),
    status: z.string(),
    verifiedAt: z.string().datetime().optional(),
    verifierId: z.string().optional(),
});
export const ValidationResultSchema = z.object({
    actId: z.string(),
    outcome: ValidationOutcomeSchema,
    validatedAt: z.string().datetime(),
    validatedBy: z.string(),
    errors: z.array(z.string()),
    fraudIndicators: z.array(FraudIndicatorSchema),
    voterVerificationResults: z.array(VoterVerificationSchema).optional(),
});
//# sourceMappingURL=ValidationResult.dto.js.map