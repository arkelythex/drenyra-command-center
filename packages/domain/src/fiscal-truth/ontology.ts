/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { EVIDENCE_NODE_KIND } from "./constants";
import {
	type EvidenceNodeKind,
	type FiscalTruthScope,
	isFiscalTruthScope,
} from "./types";

export const FISCAL_ONTOLOGY_NODE_KIND = {
	RUC: "ruc",
	FISCAL_ENTITY: "fiscal_entity",
	FISCAL_DOCUMENT: "fiscal_document",
	FISCAL_OBLIGATION: "fiscal_obligation",
	SIRE_RECORD: "sire_record",
	PLE_ENTRY: "ple_entry",
	BANK_MOVEMENT: "bank_movement",
	DETRACTION: "detraction",
	RETENTION: "retention",
	EVIDENCE_ARTIFACT: "evidence_artifact",
	TRUTH_CLAIM: "truth_claim",
	AGENT_DECISION: "agent_decision",
} as const;

export const FISCAL_ONTOLOGY_EDGE_KIND = {
	IDENTIFIES: "identifies",
	ISSUED_BY: "issued_by",
	ISSUED_TO: "issued_to",
	DECLARES: "declares",
	MATCHES: "matches",
	RECONCILES_WITH: "reconciles_with",
	SUPPORTS: "supports",
	CONTRADICTS: "contradicts",
	DERIVES_FROM: "derives_from",
	REQUIRES_APPROVAL: "requires_approval",
	PROMOTES_TO_TRUTH: "promotes_to_truth",
} as const;

export type FiscalOntologyNodeKind =
	(typeof FISCAL_ONTOLOGY_NODE_KIND)[keyof typeof FISCAL_ONTOLOGY_NODE_KIND];
export type FiscalOntologyEdgeKind =
	(typeof FISCAL_ONTOLOGY_EDGE_KIND)[keyof typeof FISCAL_ONTOLOGY_EDGE_KIND];

export interface FiscalOntologyNode {
	id: string;
	kind: FiscalOntologyNodeKind;
	scope: FiscalTruthScope;
	label: string;
	semanticKey: string;
	evidenceNodeId?: string;
	metadata: Record<string, unknown>;
}

export interface FiscalOntologyEdge {
	id: string;
	fromNodeId: string;
	toNodeId: string;
	kind: FiscalOntologyEdgeKind;
	scope: FiscalTruthScope;
	confidenceBasis: "deterministic" | "human_approved" | "agent_suggested";
	metadata: Record<string, unknown>;
}

export interface FiscalOntologyGraph {
	graphId: string;
	scope: FiscalTruthScope;
	period: string;
	nodes: FiscalOntologyNode[];
	edges: FiscalOntologyEdge[];
	createdAt: string;
}

export interface FiscalTruthClaim {
	claimId: string;
	scope: FiscalTruthScope;
	statement: string;
	ontologyNodeIds: string[];
	evidenceRootNodeId: string;
	deterministicEvidenceKinds: EvidenceNodeKind[];
	humanApprovalId: string | null;
	policyDecisionId: string | null;
	governanceBundleId: string | null;
	createdBy: string;
	createdAt: string;
}

export interface FiscalTruthClaimPromotionContext {
	graph: FiscalOntologyGraph;
	evidenceRootNodeId: string;
	policyDecisionId: string;
	humanApprovalId: string;
	governanceBundleId: string;
}

export interface FiscalOntologyManifest {
	version: "2026-05.fiscal-ontology.v1";
	positioning: "ai_augmented_fiscal_sovereignty_platform";
	nodeKinds: readonly FiscalOntologyNodeKind[];
	edgeKinds: readonly FiscalOntologyEdgeKind[];
	truthClaimRequiredEvidence: readonly EvidenceNodeKind[];
	invariants: readonly string[];
}

const requiredTruthEvidenceKinds = [
	EVIDENCE_NODE_KIND.SOURCE_INPUT,
	EVIDENCE_NODE_KIND.DETERMINISTIC_VALIDATION,
	EVIDENCE_NODE_KIND.POLICY_DECISION,
	EVIDENCE_NODE_KIND.APPROVAL,
] as const;

export function buildFiscalOntologyManifest(): FiscalOntologyManifest {
	return {
		version: "2026-05.fiscal-ontology.v1",
		positioning: "ai_augmented_fiscal_sovereignty_platform",
		nodeKinds: Object.values(FISCAL_ONTOLOGY_NODE_KIND),
		edgeKinds: Object.values(FISCAL_ONTOLOGY_EDGE_KIND),
		truthClaimRequiredEvidence: requiredTruthEvidenceKinds,
		invariants: [
			"ARKELYTHEX models fiscal sovereignty, not fixed ERP modules.",
			"A Fiscal Truth Claim must be grounded in source input, deterministic validation, policy decision and human approval evidence.",
			"Agent decisions are advisory until promoted through governance and evidence graph links.",
			"Every ontology node and edge carries tenant/company/RUC scope.",
		],
	};
}

function isSameFiscalScope(
	left: FiscalTruthScope,
	right: FiscalTruthScope,
): boolean {
	return (
		left.companyId === right.companyId &&
		left.companyRuc === right.companyRuc &&
		left.organizationId === right.organizationId &&
		left.period === right.period &&
		left.countryCode === right.countryCode
	);
}

export function canPromoteFiscalTruthClaim(
	claim: FiscalTruthClaim,
	context: FiscalTruthClaimPromotionContext,
): boolean {
	if (!isFiscalTruthScope(claim.scope)) return false;
	if (!isSameFiscalScope(claim.scope, context.graph.scope)) return false;
	if (claim.evidenceRootNodeId.trim().length === 0) return false;
	if (claim.ontologyNodeIds.length === 0) return false;
	if (
		!claim.humanApprovalId ||
		claim.humanApprovalId !== context.humanApprovalId
	) {
		return false;
	}
	if (
		!claim.policyDecisionId ||
		claim.policyDecisionId !== context.policyDecisionId
	) {
		return false;
	}
	if (
		!claim.governanceBundleId ||
		claim.governanceBundleId !== context.governanceBundleId
	) {
		return false;
	}
	if (claim.evidenceRootNodeId !== context.evidenceRootNodeId) return false;

	const nodesById = new Map(context.graph.nodes.map((node) => [node.id, node]));
	const allClaimNodesExistInScope = claim.ontologyNodeIds.every((nodeId) => {
		const node = nodesById.get(nodeId);
		return node ? isSameFiscalScope(claim.scope, node.scope) : false;
	});
	if (!allClaimNodesExistInScope) return false;

	const hasDeterministicSupportEdge = context.graph.edges.some(
		(edge) =>
			claim.ontologyNodeIds.includes(edge.fromNodeId) &&
			claim.ontologyNodeIds.includes(edge.toNodeId) &&
			edge.confidenceBasis !== "agent_suggested" &&
			isSameFiscalScope(claim.scope, edge.scope),
	);
	if (!hasDeterministicSupportEdge) return false;

	return requiredTruthEvidenceKinds.every((kind) =>
		claim.deterministicEvidenceKinds.includes(kind),
	);
}
