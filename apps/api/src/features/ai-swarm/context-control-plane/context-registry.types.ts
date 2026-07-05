import {
	APPROVAL_REQUIREMENTS,
	type ApprovalRequirement,
	CONTEXT_CORPUS_KINDS,
	CONTEXT_CORPUS_USAGES,
	CONTEXT_RETRIEVAL_MODES,
	type ContextCorpusConstraintDTO,
	type ContextRegistrySurfaceDTO,
	type ContextRetrievalMode,
	type ContextWindowDTO,
	type DeterministicFallbackDTO,
	TENANT_SCOPES,
	type TenantScope,
} from "@drenyra/application";
import { getControlPlaneJobMetadata } from "./control-plane-job-metadata";

export const CONTROL_PLANE_SURFACE_IDS = {
	PREPARE_SIRE: "prepare-sire",
	BANK_RECONCILIATION: "bank-reconciliation",
	VALIDATE_CPE: "validate-cpe",
} as const;

export type ControlPlaneSurfaceId =
	(typeof CONTROL_PLANE_SURFACE_IDS)[keyof typeof CONTROL_PLANE_SURFACE_IDS];

export interface ContextRegistrySeed {
	surfaceId: ControlPlaneSurfaceId;
	tenantScope: TenantScope;
	approvalsRequired: readonly ApprovalRequirement[];
	allowedTools: readonly string[];
	allowedCorpora: readonly ContextCorpusConstraintDTO[];
	retrievalDefault: ContextRetrievalMode;
	deterministicFallback: DeterministicFallbackDTO;
	contextWindow: ContextWindowDTO;
}

export type ContextRegistrySurface = ContextRegistrySurfaceDTO;

const DEFAULT_WINDOW: ContextWindowDTO = {
	maxMemoryItems: 8,
	maxDocumentResults: 0,
	maxToolCalls: 4,
};

const DOCUMENTARY_WINDOW: ContextWindowDTO = {
	maxMemoryItems: 8,
	maxDocumentResults: 3,
	maxToolCalls: 4,
};

const documentaryCorpus = (
	corpusId: string,
	label: string,
	rationale: string,
): ContextCorpusConstraintDTO => ({
	corpusId,
	label,
	kind: CONTEXT_CORPUS_KINDS.DOCUMENTARY,
	usage: CONTEXT_CORPUS_USAGES.RETRIEVAL,
	rationale,
	requiresApproval: false,
});

const deterministicFallback = (
	strategyId: string,
	description: string,
): DeterministicFallbackDTO => ({
	strategyId,
	description,
	owner: "apps/api/src/lib/accounting-jobs.ts",
	evidenceSource: "accounting-job-catalog",
});

export const CONTEXT_REGISTRY_SEEDS: readonly ContextRegistrySeed[] = [
	{
		surfaceId: CONTROL_PLANE_SURFACE_IDS.PREPARE_SIRE,
		tenantScope: TENANT_SCOPES.ORGANIZATION,
		approvalsRequired: getControlPlaneJobMetadata(
			CONTROL_PLANE_SURFACE_IDS.PREPARE_SIRE,
		)?.approvalsRequired ?? [APPROVAL_REQUIREMENTS.SUPERVISOR],
		allowedTools: [
			"engram-memory-read",
			"sire-period-summary",
			"sunat-rule-pack",
		],
		allowedCorpora: [
			documentaryCorpus(
				"sunat-sire-manuals",
				"SUNAT SIRE manuals",
				"Documentary retrieval is allowed only for official SIRE material.",
			),
		],
		retrievalDefault: CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY,
		deterministicFallback: deterministicFallback(
			"prepare-sire-deterministic",
			"Use existing accounting-job definitions plus deterministic SIRE checks before any AI-assisted path.",
		),
		contextWindow: DOCUMENTARY_WINDOW,
	},
	{
		surfaceId: CONTROL_PLANE_SURFACE_IDS.BANK_RECONCILIATION,
		tenantScope: TENANT_SCOPES.ORGANIZATION,
		approvalsRequired: getControlPlaneJobMetadata(
			CONTROL_PLANE_SURFACE_IDS.BANK_RECONCILIATION,
		)?.approvalsRequired ?? [APPROVAL_REQUIREMENTS.SUPERVISOR],
		allowedTools: [
			"engram-memory-read",
			"bank-ledger-diff",
			"reconciliation-shadow-read",
		],
		allowedCorpora: [],
		retrievalDefault: CONTEXT_RETRIEVAL_MODES.MEMORY_AND_TOOLS,
		deterministicFallback: deterministicFallback(
			"bank-reconciliation-deterministic",
			"Use the current reconciliation job flow and diff tooling without documentary retrieval.",
		),
		contextWindow: DEFAULT_WINDOW,
	},
	{
		surfaceId: CONTROL_PLANE_SURFACE_IDS.VALIDATE_CPE,
		tenantScope: TENANT_SCOPES.ORGANIZATION,
		approvalsRequired:
			getControlPlaneJobMetadata(CONTROL_PLANE_SURFACE_IDS.VALIDATE_CPE)
				?.approvalsRequired ?? [],
		allowedTools: [
			"engram-memory-read",
			"sunat-rule-pack",
			"cpe-validation-read",
		],
		allowedCorpora: [
			documentaryCorpus(
				"sunat-cpe-specs",
				"SUNAT CPE specification",
				"Hybrid retrieval stays limited to documentary compliance corpora.",
			),
		],
		retrievalDefault: CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY,
		deterministicFallback: deterministicFallback(
			"validate-cpe-deterministic",
			"Fall back to deterministic SUNAT validation and traceable rule-pack output.",
		),
		contextWindow: DOCUMENTARY_WINDOW,
	},
] as const;
