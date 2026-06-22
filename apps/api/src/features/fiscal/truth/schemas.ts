import { z } from "zod";

export const fiscalTruthScopeSchema = z.object({
	companyId: z.string().min(1),
	companyRuc: z.string().regex(/^\d{11}$/),
	organizationId: z.union([z.number(), z.null()]),
	period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
	countryCode: z.string().length(2),
});

export const appendFiscalTruthBodySchema = z.object({
	evidence: z.object({
		nodeId: z.string().min(1),
		nodeKind: z.string().min(1),
		scope: fiscalTruthScopeSchema,
		trace: z.object({
			traceId: z.string().min(1),
			correlationId: z.string().min(1),
			causationId: z.union([z.string(), z.null()]),
		}),
		hash: z.string().min(1),
		createdAt: z.string(),
		metadata: z.record(z.string(), z.unknown()),
	}),
	event: z.object({
		eventId: z.string().min(1),
		aggregateId: z.string().min(1),
		aggregateType: z.string().min(1),
		eventKind: z.string().min(1),
		scope: fiscalTruthScopeSchema,
		trace: z.object({
			traceId: z.string().min(1),
			correlationId: z.string().min(1),
			causationId: z.union([z.string(), z.null()]),
		}),
		validatorSetVersion: z.string().min(1),
		policyVersion: z.string().min(1),
		evidenceRootNodeId: z.string().min(1),
		evidenceBundleHash: z.string().min(1),
		approvalId: z.union([z.string(), z.null()]),
		occurredAt: z.string(),
		payload: z.record(z.string(), z.unknown()),
	}),
	validatorResults: z.array(
		z.object({
			validatorName: z.string(),
			validatorVersion: z.string(),
			inputHash: z.string(),
			isValid: z.boolean(),
			code: z.string(),
			reason: z.string(),
			severity: z.union([
				z.literal("info"),
				z.literal("warning"),
				z.literal("blocking"),
			]),
			observedAt: z.string(),
			payload: z.record(z.string(), z.unknown()),
		}),
	),
	policyDecision: z.object({
		decisionId: z.string().min(1),
		policyVersion: z.string().min(1),
		governance: z.object({
			governanceBundleId: z.string(),
			policyVersion: z.string(),
			specVersion: z.string(),
			architectureDocVersion: z.string(),
			glossaryVersion: z.string(),
			adrIds: z.array(z.string()),
			reviewStatus: z.union([
				z.literal("approved"),
				z.literal("rejected"),
				z.literal("superseded"),
			]),
			approvedAt: z.union([z.string(), z.null()]),
		}),
		outcome: z.union([
			z.literal("blocked"),
			z.literal("approval_required"),
			z.literal("promotable"),
		]),
		rationale: z.string(),
		decidedAt: z.string(),
	}),
	hasRequiredApproval: z.boolean(),
});
