import { z } from "zod";
import type {
	DeterministicFallbackDTO,
	TenantScope,
} from "./context-registry.dto";
import type { ContextWindowDTO } from "./context-run.dto";

export const CONTEXT_RETRIEVAL_MODES = {
	MEMORY_ONLY: "memory-only",
	MEMORY_AND_TOOLS: "memory-and-tools",
	HYBRID_DOCUMENTARY: "hybrid-documentary",
} as const;

export type ContextRetrievalMode =
	(typeof CONTEXT_RETRIEVAL_MODES)[keyof typeof CONTEXT_RETRIEVAL_MODES];

export const CONTEXT_APPROVAL_STATES = {
	NOT_REQUIRED: "not-required",
	PENDING: "pending",
	APPROVED: "approved",
	REJECTED: "rejected",
} as const;

export type ContextApprovalState =
	(typeof CONTEXT_APPROVAL_STATES)[keyof typeof CONTEXT_APPROVAL_STATES];

export const CONTEXT_POLICY_VIOLATION_CODES = {
	UNKNOWN_SURFACE: "unknown-surface",
	TOOL_NOT_ALLOWED: "tool-not-allowed",
	CORPUS_NOT_ALLOWED: "corpus-not-allowed",
	DOCUMENTARY_RAG_ONLY: "documentary-rag-only",
} as const;

export type ContextPolicyViolationCode =
	(typeof CONTEXT_POLICY_VIOLATION_CODES)[keyof typeof CONTEXT_POLICY_VIOLATION_CODES];

export interface ContextPolicySelectionRequestDTO {
	surfaceId: string;
	tenantId: string;
	traceId?: string;
	requestedTools?: string[];
	requestedCorpora?: string[];
}

export interface ContextPolicyViolationDTO {
	code: ContextPolicyViolationCode;
	message: string;
	subject?: string;
}

export interface ContextPolicySelectionResponseDTO {
	traceId: string;
	surfaceId: string;
	tenantScope: TenantScope | null;
	allowed: boolean;
	retrievalMode: ContextRetrievalMode;
	approvalState: ContextApprovalState;
	allowedTools: string[];
	allowedCorpora: string[];
	contextWindow: ContextWindowDTO | null;
	deterministicFallback: DeterministicFallbackDTO | null;
	violations: ContextPolicyViolationDTO[];
}

export const ContextPolicySelectionRequestSchema = z.object({
	surfaceId: z.string().min(1),
	tenantId: z.string().min(1),
	traceId: z.string().min(1).optional(),
	requestedTools: z.array(z.string().min(1)).optional(),
	requestedCorpora: z.array(z.string().min(1)).optional(),
});

export const ContextPolicyViolationSchema = z.object({
	code: z.enum([
		CONTEXT_POLICY_VIOLATION_CODES.UNKNOWN_SURFACE,
		CONTEXT_POLICY_VIOLATION_CODES.TOOL_NOT_ALLOWED,
		CONTEXT_POLICY_VIOLATION_CODES.CORPUS_NOT_ALLOWED,
		CONTEXT_POLICY_VIOLATION_CODES.DOCUMENTARY_RAG_ONLY,
	]),
	message: z.string().min(1),
	subject: z.string().min(1).optional(),
});

export const ContextPolicySelectionResponseSchema = z.object({
	traceId: z.string().min(1),
	surfaceId: z.string().min(1),
	tenantScope: z.string().min(1).nullable(),
	allowed: z.boolean(),
	retrievalMode: z.enum([
		CONTEXT_RETRIEVAL_MODES.MEMORY_ONLY,
		CONTEXT_RETRIEVAL_MODES.MEMORY_AND_TOOLS,
		CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY,
	]),
	approvalState: z.enum([
		CONTEXT_APPROVAL_STATES.NOT_REQUIRED,
		CONTEXT_APPROVAL_STATES.PENDING,
		CONTEXT_APPROVAL_STATES.APPROVED,
		CONTEXT_APPROVAL_STATES.REJECTED,
	]),
	allowedTools: z.array(z.string().min(1)),
	allowedCorpora: z.array(z.string().min(1)),
	contextWindow: z
		.object({
			maxMemoryItems: z.number().int().positive(),
			maxDocumentResults: z.number().int().nonnegative(),
			maxToolCalls: z.number().int().positive(),
		})
		.nullable(),
	deterministicFallback: z
		.object({
			strategyId: z.string().min(1),
			description: z.string().min(1),
			owner: z.string().min(1),
			evidenceSource: z.string().min(1),
		})
		.nullable(),
	violations: z.array(ContextPolicyViolationSchema),
});
