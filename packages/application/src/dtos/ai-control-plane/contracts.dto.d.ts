import { z } from "zod";
export declare const AiTenantScopeSchema: z.ZodObject<
	{
		tenantId: z.ZodString;
		organizationId: z.ZodString;
		companyId: z.ZodString;
		ruc: z.ZodString;
	},
	z.core.$strip
>;
export declare const AdvisoryOutputEnvelopeSchema: z.ZodObject<
	{
		advisoryId: z.ZodString;
		traceId: z.ZodString;
		tenantScope: z.ZodObject<
			{
				tenantId: z.ZodString;
				organizationId: z.ZodString;
				companyId: z.ZodString;
				ruc: z.ZodString;
			},
			z.core.$strip
		>;
		summary: z.ZodString;
		advisoryOnly: z.ZodLiteral<true>;
		authoritativeMutationProhibited: z.ZodLiteral<true>;
	},
	z.core.$strip
>;
export declare const ApprovalLineageSchema: z.ZodObject<
	{
		approvalId: z.ZodString;
		state: z.ZodEnum<{
			approved: "approved";
			rejected: "rejected";
			proposed: "proposed";
			validated: "validated";
		}>;
		reviewerRole: z.ZodEnum<{
			supervisor: "supervisor";
			"financial-controller": "financial-controller";
		}>;
	},
	z.core.$strip
>;
export declare const TraceReferenceSchema: z.ZodObject<
	{
		traceId: z.ZodString;
		redacted: z.ZodLiteral<true>;
		outputHash: z.ZodString;
	},
	z.core.$strip
>;
export declare const DeterministicHandoffEnvelopeSchema: z.ZodObject<
	{
		handoffId: z.ZodString;
		traceId: z.ZodString;
		tenantScope: z.ZodObject<
			{
				tenantId: z.ZodString;
				organizationId: z.ZodString;
				companyId: z.ZodString;
				ruc: z.ZodString;
			},
			z.core.$strip
		>;
		approvalState: z.ZodEnum<{
			approved: "approved";
			rejected: "rejected";
			proposed: "proposed";
			validated: "validated";
		}>;
		commandSource: z.ZodLiteral<"deterministic-command">;
		commandRef: z.ZodString;
	},
	z.core.$strip
>;
export type AiTenantScopeDTO = z.infer<typeof AiTenantScopeSchema>;
export type AdvisoryOutputEnvelopeDTO = z.infer<
	typeof AdvisoryOutputEnvelopeSchema
>;
export type ApprovalLineageDTO = z.infer<typeof ApprovalLineageSchema>;
export type TraceReferenceDTO = z.infer<typeof TraceReferenceSchema>;
export type DeterministicHandoffEnvelopeDTO = z.infer<
	typeof DeterministicHandoffEnvelopeSchema
>;
//# sourceMappingURL=contracts.dto.d.ts.map
