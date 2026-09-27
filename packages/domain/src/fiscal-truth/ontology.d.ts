import { type EvidenceNodeKind, type FiscalTruthScope } from "./types";
export declare const FISCAL_ONTOLOGY_NODE_KIND: {
    readonly RUC: "ruc";
    readonly FISCAL_ENTITY: "fiscal_entity";
    readonly FISCAL_DOCUMENT: "fiscal_document";
    readonly FISCAL_OBLIGATION: "fiscal_obligation";
    readonly SIRE_RECORD: "sire_record";
    readonly PLE_ENTRY: "ple_entry";
    readonly BANK_MOVEMENT: "bank_movement";
    readonly DETRACTION: "detraction";
    readonly RETENTION: "retention";
    readonly EVIDENCE_ARTIFACT: "evidence_artifact";
    readonly TRUTH_CLAIM: "truth_claim";
    readonly AGENT_DECISION: "agent_decision";
};
export declare const FISCAL_ONTOLOGY_EDGE_KIND: {
    readonly IDENTIFIES: "identifies";
    readonly ISSUED_BY: "issued_by";
    readonly ISSUED_TO: "issued_to";
    readonly DECLARES: "declares";
    readonly MATCHES: "matches";
    readonly RECONCILES_WITH: "reconciles_with";
    readonly SUPPORTS: "supports";
    readonly CONTRADICTS: "contradicts";
    readonly DERIVES_FROM: "derives_from";
    readonly REQUIRES_APPROVAL: "requires_approval";
    readonly PROMOTES_TO_TRUTH: "promotes_to_truth";
};
export type FiscalOntologyNodeKind = (typeof FISCAL_ONTOLOGY_NODE_KIND)[keyof typeof FISCAL_ONTOLOGY_NODE_KIND];
export type FiscalOntologyEdgeKind = (typeof FISCAL_ONTOLOGY_EDGE_KIND)[keyof typeof FISCAL_ONTOLOGY_EDGE_KIND];
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
export declare function buildFiscalOntologyManifest(): FiscalOntologyManifest;
export declare function canPromoteFiscalTruthClaim(claim: FiscalTruthClaim, context: FiscalTruthClaimPromotionContext): boolean;
//# sourceMappingURL=ontology.d.ts.map