import { z } from "zod";

const nonEmpty = z.string().min(1);

export const AiTenantScopeSchema = z.object({
	tenantId: nonEmpty,
	organizationId: nonEmpty,
	companyId: nonEmpty,
	ruc: z.string().regex(/^\d{11}$/),
});

export const AdvisoryOutputEnvelopeSchema = z.object({
	advisoryId: nonEmpty,
	traceId: nonEmpty,
	tenantScope: AiTenantScopeSchema,
	summary: nonEmpty,
	advisoryOnly: z.literal(true),
	authoritativeMutationProhibited: z.literal(true),
});

export const ApprovalLineageSchema = z.object({
	approvalId: nonEmpty,
	state: z.enum(["proposed", "validated", "approved", "rejected"]),
	reviewerRole: z.enum(["supervisor", "financial-controller"]),
});

export const TraceReferenceSchema = z.object({
	traceId: nonEmpty,
	redacted: z.literal(true),
	outputHash: nonEmpty,
});

export const DeterministicHandoffEnvelopeSchema = z
	.object({
		handoffId: nonEmpty,
		traceId: nonEmpty,
		tenantScope: AiTenantScopeSchema,
		approvalState: z.enum(["proposed", "validated", "approved", "rejected"]),
		commandSource: z.literal("deterministic-command"),
		commandRef: nonEmpty,
	})
	.refine((value) => value.approvalState === "approved", {
		message: "handoff requires approved state",
	});

export type AiTenantScopeDTO = z.infer<typeof AiTenantScopeSchema>;
export type AdvisoryOutputEnvelopeDTO = z.infer<
	typeof AdvisoryOutputEnvelopeSchema
>;
export type ApprovalLineageDTO = z.infer<typeof ApprovalLineageSchema>;
export type TraceReferenceDTO = z.infer<typeof TraceReferenceSchema>;
export type DeterministicHandoffEnvelopeDTO = z.infer<
	typeof DeterministicHandoffEnvelopeSchema
>;
