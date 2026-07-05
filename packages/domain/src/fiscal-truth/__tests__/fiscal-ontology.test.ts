import { describe, expect, it } from "vitest";
import { EVIDENCE_NODE_KIND } from "../constants";
import {
	buildFiscalOntologyManifest,
	canPromoteFiscalTruthClaim,
	type FiscalTruthClaim,
} from "../ontology";

const scopedClaim: FiscalTruthClaim = {
	claimId: "claim-001",
	scope: {
		companyId: "company-001",
		companyRuc: "20123456786",
		organizationId: 1,
		period: "2026-05",
		countryCode: "PE",
	},
	statement: "Factura F001-1 concilia con SIRE ventas y movimiento bancario.",
	ontologyNodeIds: ["doc-001", "sire-001", "bank-001"],
	evidenceRootNodeId: "evidence-root-001",
	deterministicEvidenceKinds: [
		EVIDENCE_NODE_KIND.SOURCE_INPUT,
		EVIDENCE_NODE_KIND.DETERMINISTIC_VALIDATION,
		EVIDENCE_NODE_KIND.POLICY_DECISION,
		EVIDENCE_NODE_KIND.APPROVAL,
	],
	humanApprovalId: "approval-001",
	policyDecisionId: "policy-001",
	governanceBundleId: "governance-001",
	createdBy: "fiscal-reviewer-001",
	createdAt: "2026-05-26T00:00:00.000Z",
};

const scopedGraph = {
	graphId: "graph-001",
	scope: scopedClaim.scope,
	period: "2026-05",
	nodes: [
		{
			id: "doc-001",
			kind: "fiscal_document" as const,
			scope: scopedClaim.scope,
			label: "Factura F001-1",
			semanticKey: "invoice:F001-1",
			evidenceNodeId: "evidence-root-001",
			metadata: {},
		},
		{
			id: "sire-001",
			kind: "sire_record" as const,
			scope: scopedClaim.scope,
			label: "SIRE venta F001-1",
			semanticKey: "sire:sales:F001-1",
			metadata: {},
		},
		{
			id: "bank-001",
			kind: "bank_movement" as const,
			scope: scopedClaim.scope,
			label: "Abono bancario",
			semanticKey: "bank:deposit:001",
			metadata: {},
		},
	],
	edges: [
		{
			id: "edge-001",
			fromNodeId: "doc-001",
			toNodeId: "sire-001",
			kind: "matches" as const,
			scope: scopedClaim.scope,
			confidenceBasis: "deterministic" as const,
			metadata: {},
		},
	],
	createdAt: "2026-05-26T00:00:00.000Z",
};

const promotionContext = {
	graph: scopedGraph,
	evidenceRootNodeId: "evidence-root-001",
	policyDecisionId: "policy-001",
	humanApprovalId: "approval-001",
	governanceBundleId: "governance-001",
};

describe("Fiscal Ontology foundation", () => {
	it("declares ARKELYTHEX as fiscal sovereignty platform rather than ERP modules", () => {
		const manifest = buildFiscalOntologyManifest();

		expect(manifest.positioning).toBe(
			"ai_augmented_fiscal_sovereignty_platform",
		);
		expect(manifest.nodeKinds).toContain("truth_claim");
		expect(manifest.nodeKinds).toContain("agent_decision");
		expect(manifest.edgeKinds).toContain("promotes_to_truth");
	});

	it("allows truth claim promotion only with evidence root, ontology links and approval", () => {
		expect(canPromoteFiscalTruthClaim(scopedClaim, promotionContext)).toBe(
			true,
		);
		expect(
			canPromoteFiscalTruthClaim(
				{ ...scopedClaim, humanApprovalId: null },
				promotionContext,
			),
		).toBe(false);
		expect(
			canPromoteFiscalTruthClaim(
				{ ...scopedClaim, evidenceRootNodeId: "" },
				promotionContext,
			),
		).toBe(false);
		expect(
			canPromoteFiscalTruthClaim(
				{ ...scopedClaim, ontologyNodeIds: [] },
				promotionContext,
			),
		).toBe(false);
	});

	it("rejects promotion when deterministic validation evidence is missing", () => {
		const incompleteClaim = {
			...scopedClaim,
			deterministicEvidenceKinds: [
				EVIDENCE_NODE_KIND.SOURCE_INPUT,
				EVIDENCE_NODE_KIND.POLICY_DECISION,
				EVIDENCE_NODE_KIND.APPROVAL,
			],
		};

		expect(canPromoteFiscalTruthClaim(incompleteClaim, promotionContext)).toBe(
			false,
		);
	});

	it("rejects cross-scope ontology links and agent-suggested edges", () => {
		const crossScope = {
			...scopedClaim.scope,
			companyId: "company-002",
		};
		const crossScopeGraph = {
			...scopedGraph,
			edges: [{ ...scopedGraph.edges[0], scope: crossScope }],
		};
		const agentSuggestedGraph = {
			...scopedGraph,
			edges: [
				{
					...scopedGraph.edges[0],
					confidenceBasis: "agent_suggested" as const,
				},
			],
		};

		expect(
			canPromoteFiscalTruthClaim(scopedClaim, {
				...promotionContext,
				graph: crossScopeGraph,
			}),
		).toBe(false);
		expect(
			canPromoteFiscalTruthClaim(scopedClaim, {
				...promotionContext,
				graph: agentSuggestedGraph,
			}),
		).toBe(false);
	});
});
