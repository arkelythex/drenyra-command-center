import { EVIDENCE_NODE_KIND } from "./constants";
import { isFiscalTruthScope, } from "./types";
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
};
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
};
const requiredTruthEvidenceKinds = [
    EVIDENCE_NODE_KIND.SOURCE_INPUT,
    EVIDENCE_NODE_KIND.DETERMINISTIC_VALIDATION,
    EVIDENCE_NODE_KIND.POLICY_DECISION,
    EVIDENCE_NODE_KIND.APPROVAL,
];
export function buildFiscalOntologyManifest() {
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
function isSameFiscalScope(left, right) {
    return (left.companyId === right.companyId &&
        left.companyRuc === right.companyRuc &&
        left.organizationId === right.organizationId &&
        left.period === right.period &&
        left.countryCode === right.countryCode);
}
export function canPromoteFiscalTruthClaim(claim, context) {
    if (!isFiscalTruthScope(claim.scope))
        return false;
    if (!isSameFiscalScope(claim.scope, context.graph.scope))
        return false;
    if (claim.evidenceRootNodeId.trim().length === 0)
        return false;
    if (claim.ontologyNodeIds.length === 0)
        return false;
    if (!claim.humanApprovalId ||
        claim.humanApprovalId !== context.humanApprovalId) {
        return false;
    }
    if (!claim.policyDecisionId ||
        claim.policyDecisionId !== context.policyDecisionId) {
        return false;
    }
    if (!claim.governanceBundleId ||
        claim.governanceBundleId !== context.governanceBundleId) {
        return false;
    }
    if (claim.evidenceRootNodeId !== context.evidenceRootNodeId)
        return false;
    const nodesById = new Map(context.graph.nodes.map((node) => [node.id, node]));
    const allClaimNodesExistInScope = claim.ontologyNodeIds.every((nodeId) => {
        const node = nodesById.get(nodeId);
        return node ? isSameFiscalScope(claim.scope, node.scope) : false;
    });
    if (!allClaimNodesExistInScope)
        return false;
    const hasDeterministicSupportEdge = context.graph.edges.some((edge) => claim.ontologyNodeIds.includes(edge.fromNodeId) &&
        claim.ontologyNodeIds.includes(edge.toNodeId) &&
        edge.confidenceBasis !== "agent_suggested" &&
        isSameFiscalScope(claim.scope, edge.scope));
    if (!hasDeterministicSupportEdge)
        return false;
    return requiredTruthEvidenceKinds.every((kind) => claim.deterministicEvidenceKinds.includes(kind));
}
//# sourceMappingURL=ontology.js.map