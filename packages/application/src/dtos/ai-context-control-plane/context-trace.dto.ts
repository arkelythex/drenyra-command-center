import { z } from "zod";
import {
	CONTEXT_APPROVAL_STATES,
	CONTEXT_RETRIEVAL_MODES,
} from "./context-policy.dto";
import { CONTEXT_EVALUATION_STATES } from "./evaluation.dto";

export const CONTEXT_TRACE_EVENT_TYPES = {
	POLICY_RESOLVED: "policy-resolved",
	EVALUATION_RECORDED: "evaluation-recorded",
	APPROVAL_CHECKPOINT: "approval-checkpoint",
} as const;

export type ContextTraceEventType =
	(typeof CONTEXT_TRACE_EVENT_TYPES)[keyof typeof CONTEXT_TRACE_EVENT_TYPES];

export interface ContextTraceAttributesDTO {
	traceId: string;
	runId: string;
	surfaceId: string;
	tenantId: string;
	organizationId?: number | null;
	retrievalMode?: string;
	approvalState?: string;
	evaluationState?: string;
	requestedTools?: string[];
	requestedCorpora?: string[];
}

export interface ContextTraceRecordDTO {
	eventType: ContextTraceEventType;
	traceId: string;
	occurredAt: string;
	summary: string;
	piiRedacted: boolean;
	attributes: ContextTraceAttributesDTO;
}

export const ContextTraceAttributesSchema = z.object({
	traceId: z.string().min(1),
	runId: z.string().min(1),
	surfaceId: z.string().min(1),
	tenantId: z.string().min(1),
	organizationId: z.number().int().positive().nullable().optional(),
	retrievalMode: z
		.enum([
			CONTEXT_RETRIEVAL_MODES.MEMORY_ONLY,
			CONTEXT_RETRIEVAL_MODES.MEMORY_AND_TOOLS,
			CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY,
		])
		.optional(),
	approvalState: z
		.enum([
			CONTEXT_APPROVAL_STATES.NOT_REQUIRED,
			CONTEXT_APPROVAL_STATES.PENDING,
			CONTEXT_APPROVAL_STATES.APPROVED,
			CONTEXT_APPROVAL_STATES.REJECTED,
		])
		.optional(),
	evaluationState: z
		.enum([
			CONTEXT_EVALUATION_STATES.GREEN,
			CONTEXT_EVALUATION_STATES.YELLOW,
			CONTEXT_EVALUATION_STATES.RED,
		])
		.optional(),
	requestedTools: z.array(z.string().min(1)).optional(),
	requestedCorpora: z.array(z.string().min(1)).optional(),
});

export const ContextTraceRecordSchema = z.object({
	eventType: z.enum([
		CONTEXT_TRACE_EVENT_TYPES.POLICY_RESOLVED,
		CONTEXT_TRACE_EVENT_TYPES.EVALUATION_RECORDED,
		CONTEXT_TRACE_EVENT_TYPES.APPROVAL_CHECKPOINT,
	]),
	traceId: z.string().min(1),
	occurredAt: z.string().min(1),
	summary: z.string().min(1),
	piiRedacted: z.boolean(),
	attributes: ContextTraceAttributesSchema,
});
