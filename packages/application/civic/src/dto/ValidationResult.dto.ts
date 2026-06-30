/**
 * ValidationResult DTO — Output of electoral act validation
 */
import { z } from "zod";

export type ValidationOutcome = "approved" | "rejected" | "needs-review";

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

export type FraudIndicatorDTO = z.infer<typeof FraudIndicatorSchema>;

export const EvidenceInputSchema = z.object({
	hash: z.string(),
	type: z.string(),
	content: z.string().optional(),
});

export type EvidenceInput = z.infer<typeof EvidenceInputSchema>;

export const VoterVerificationSchema = z.object({
	dni: z.string(),
	status: z.string(),
	verifiedAt: z.string().datetime().optional(),
	verifierId: z.string().optional(),
});

export type VoterVerificationDTO = z.infer<typeof VoterVerificationSchema>;

export const ValidationResultSchema = z.object({
	actId: z.string(),
	outcome: ValidationOutcomeSchema,
	validatedAt: z.string().datetime(),
	validatedBy: z.string(),
	errors: z.array(z.string()),
	fraudIndicators: z.array(FraudIndicatorSchema),
	voterVerificationResults: z.array(VoterVerificationSchema).optional(),
});

export type ValidationResultDTO = z.infer<typeof ValidationResultSchema>;
