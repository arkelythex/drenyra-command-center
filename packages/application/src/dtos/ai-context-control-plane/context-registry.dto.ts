import { z } from "zod";
import type { ContextRetrievalMode } from "./context-policy.dto";
import type { ContextWindowDTO } from "./context-run.dto";

export const TENANT_SCOPES = {
	ORGANIZATION: "organization",
	PORTFOLIO: "portfolio",
} as const;

export type TenantScope = (typeof TENANT_SCOPES)[keyof typeof TENANT_SCOPES];

export const APPROVAL_REQUIREMENTS = {
	SUPERVISOR: "supervisor",
	FINANCIAL_CONTROLLER: "financial-controller",
} as const;

export type ApprovalRequirement =
	(typeof APPROVAL_REQUIREMENTS)[keyof typeof APPROVAL_REQUIREMENTS];

export const CONTEXT_CORPUS_KINDS = {
	DOCUMENTARY: "documentary",
} as const;

export type ContextCorpusKind =
	(typeof CONTEXT_CORPUS_KINDS)[keyof typeof CONTEXT_CORPUS_KINDS];

export const CONTEXT_CORPUS_USAGES = {
	RETRIEVAL: "retrieval",
} as const;

export type ContextCorpusUsage =
	(typeof CONTEXT_CORPUS_USAGES)[keyof typeof CONTEXT_CORPUS_USAGES];

export interface ContextCorpusConstraintDTO {
	corpusId: string;
	label: string;
	kind: ContextCorpusKind;
	usage: ContextCorpusUsage;
	rationale: string;
	requiresApproval: boolean;
}

export interface DeterministicFallbackDTO {
	strategyId: string;
	description: string;
	owner: string;
	evidenceSource: string;
}

export interface ContextRegistrySurfaceDTO {
	surfaceId: string;
	jobId: string;
	title: string;
	description: string;
	tenantScope: TenantScope;
	approvalsRequired: ApprovalRequirement[];
	allowedTools: string[];
	allowedCorpora: ContextCorpusConstraintDTO[];
	retrievalDefault: ContextRetrievalMode;
	deterministicFallback: DeterministicFallbackDTO;
	contextWindow: ContextWindowDTO;
}

export const ContextCorpusConstraintSchema = z.object({
	corpusId: z.string().min(1),
	label: z.string().min(1),
	kind: z.enum([CONTEXT_CORPUS_KINDS.DOCUMENTARY]),
	usage: z.enum([CONTEXT_CORPUS_USAGES.RETRIEVAL]),
	rationale: z.string().min(1),
	requiresApproval: z.boolean(),
});

export const DeterministicFallbackSchema = z.object({
	strategyId: z.string().min(1),
	description: z.string().min(1),
	owner: z.string().min(1),
	evidenceSource: z.string().min(1),
});

export const ContextRegistrySurfaceSchema = z.object({
	surfaceId: z.string().min(1),
	jobId: z.string().min(1),
	title: z.string().min(1),
	description: z.string().min(1),
	tenantScope: z.enum([TENANT_SCOPES.ORGANIZATION, TENANT_SCOPES.PORTFOLIO]),
	approvalsRequired: z.array(
		z.enum([
			APPROVAL_REQUIREMENTS.SUPERVISOR,
			APPROVAL_REQUIREMENTS.FINANCIAL_CONTROLLER,
		]),
	),
	allowedTools: z.array(z.string().min(1)),
	allowedCorpora: z.array(ContextCorpusConstraintSchema),
	retrievalDefault: z.string().min(1),
	deterministicFallback: DeterministicFallbackSchema,
	contextWindow: z.object({
		maxMemoryItems: z.number().int().positive(),
		maxDocumentResults: z.number().int().nonnegative(),
		maxToolCalls: z.number().int().positive(),
	}),
});
