import type {
	EvidenceEdge,
	EvidenceNode,
	EvidenceNodeKind,
	FiscalTruthEvent,
	FiscalTruthScope,
	GovernanceBundleReference,
	PolicyDecisionRecord,
	ReplayResult,
} from "@arkelythex/domain";
import { EVIDENCE_NODE_KIND, POLICY_OUTCOME } from "@arkelythex/domain";
import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFiscalTruthModule } from "../../module";

function scope(companyId = "cmp-1"): FiscalTruthScope {
	return {
		companyId,
		companyRuc: "20100070970",
		organizationId: null,
		period: "2026-05",
		countryCode: "PE",
	};
}
function governance(
	status: GovernanceBundleReference["reviewStatus"] = "approved",
): GovernanceBundleReference {
	return {
		governanceBundleId: "gb-1",
		policyVersion: "v1",
		specVersion: "v1",
		architectureDocVersion: "v1",
		glossaryVersion: "v1",
		adrIds: ["ADR-019", "ADR-020"],
		reviewStatus: status,
		approvedAt: status === "approved" ? "2026-05-04T00:00:00.000Z" : null,
	};
}
function node(
	nodeKind: EvidenceNodeKind = EVIDENCE_NODE_KIND.SOURCE_INPUT,
): EvidenceNode {
	return {
		nodeId: "node-1",
		nodeKind,
		scope: scope(),
		trace: { traceId: "trace-1", correlationId: "corr-1", causationId: null },
		hash: "hash-bundle",
		createdAt: "2026-05-04T00:00:00.000Z",
		metadata: {},
	};
}
function event(): FiscalTruthEvent {
	return {
		eventId: "evt-1",
		aggregateId: "inv-1",
		aggregateType: "invoice",
		eventKind: "authoritative_truth_promoted",
		scope: scope(),
		trace: { traceId: "trace-1", correlationId: "corr-1", causationId: null },
		validatorSetVersion: "validators-v1",
		policyVersion: "policy-v1",
		evidenceRootNodeId: "node-1",
		evidenceBundleHash: "hash-bundle",
		approvalId: "approval-1",
		occurredAt: "2026-05-04T00:00:00.000Z",
		payload: {
			provenance: {
				validatorResults: [
					{
						validatorName: "sunat",
						validatorVersion: "validators-v1",
						inputHash: "h",
						isValid: true,
						code: "VALIDATION_OK",
						reason: "ok",
						severity: "info",
						observedAt: "2026-05-04T00:00:00.000Z",
						payload: {},
					},
				],
				policyDecision: policy(),
				governance: governance("approved"),
				approval: { required: true, approvalId: "approval-1" },
				evidence: {
					rootNodeId: "node-1",
					bundleHash: "hash-bundle",
					nodeId: "node-1",
					nodeHash: "hash-bundle",
				},
			},
		},
	};
}
function policy(): PolicyDecisionRecord {
	return {
		decisionId: "decision-1",
		policyVersion: "policy-v1",
		governance: governance("approved"),
		outcome: POLICY_OUTCOME.PROMOTABLE,
		rationale: "ok",
		decidedAt: "2026-05-04T00:00:00.000Z",
	};
}

describe("fiscal truth routes", () => {
	const nodes = new Map<string, EvidenceNode>();
	const events = new Map<string, FiscalTruthEvent>();
	const edges: EvidenceEdge[] = [];
	const replays: ReplayResult[] = [];
	const app = new Elysia().use(
		createFiscalTruthModule({
			evidenceRepository: {
				appendNode: vi.fn(
					async (n: EvidenceNode) => void nodes.set(n.nodeId, n),
				),
				appendEdge: vi.fn(async (e: EvidenceEdge) => void edges.push(e)),
				findNodeById: vi.fn(async (id: string, s: FiscalTruthScope) => {
					const n = nodes.get(id);
					return n &&
						n.scope.companyId === s.companyId &&
						n.scope.companyRuc === s.companyRuc
						? n
						: null;
				}),
				findEdgesFromNode: vi.fn(async (id: string, s: FiscalTruthScope) =>
					edges.filter(
						(e) =>
							e.fromNodeId === id &&
							e.scope.companyId === s.companyId &&
							e.scope.companyRuc === s.companyRuc,
					),
				),
			},
			fiscalTruthRepository: {
				append: vi.fn(
					async (e: FiscalTruthEvent) => void events.set(e.eventId, e),
				),
				findByEventId: vi.fn(async (id: string, s: FiscalTruthScope) => {
					const e = events.get(id);
					return e &&
						e.scope.companyId === s.companyId &&
						e.scope.companyRuc === s.companyRuc
						? e
						: null;
				}),
				findByAggregateId: vi.fn(async (id: string, s: FiscalTruthScope) =>
					Array.from(events.values()).filter(
						(e) =>
							e.aggregateId === id &&
							e.scope.companyId === s.companyId &&
							e.scope.companyRuc === s.companyRuc,
					),
				),
			},
			replayRepository: {
				loadEventChain: vi.fn(async (id: string, s: FiscalTruthScope) =>
					Array.from(events.values()).filter(
						(e) =>
							e.aggregateId === id &&
							e.scope.companyId === s.companyId &&
							e.scope.companyRuc === s.companyRuc,
					),
				),
				saveReplayResult: vi.fn(
					async (_aggregateId: string, result: ReplayResult) =>
						void replays.push(result),
				),
			},
			governanceVerifier: {
				verify: vi.fn(
					async (bundle: GovernanceBundleReference) =>
						bundle.reviewStatus === "approved",
				),
			},
		}),
	);

	beforeEach(() => {
		nodes.clear();
		events.clear();
		edges.splice(0, edges.length);
		replays.splice(0, replays.length);
	});

	it("appends and promotes one fiscal-truth event", async () => {
		const response = await app.handle(
			new Request("http://localhost/fiscal-truth/append", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-company-ruc": "20100070970",
					"x-fiscal-period": "2026-05",
				},
				body: JSON.stringify({
					evidence: node(),
					event: event(),
					validatorResults: [
						{
							validatorName: "sunat",
							validatorVersion: "validators-v1",
							inputHash: "h",
							isValid: true,
							code: "VALIDATION_OK",
							reason: "ok",
							severity: "info",
							observedAt: "2026-05-04T00:00:00.000Z",
							payload: {},
						},
					],
					policyDecision: policy(),
					hasRequiredApproval: true,
				}),
			}),
		);
		expect(response.status).toBe(202);
		const storedEvent = events.get("evt-1");
		expect(storedEvent).toBeDefined();
		expect(storedEvent?.payload).toMatchObject({
			provenance: {
				validatorResults: expect.any(Array),
				policyDecision: expect.any(Object),
				governance: expect.any(Object),
				approval: { required: true },
				evidence: {
					rootNodeId: "node-1",
					bundleHash: "hash-bundle",
				},
			},
		});
	});

	it("reads one scoped fiscal-truth event", async () => {
		events.set("evt-1", event());
		const response = await app.handle(
			new Request("http://localhost/fiscal-truth/events/evt-1", {
				headers: {
					"x-company-id": "cmp-1",
					"x-company-ruc": "20100070970",
					"x-fiscal-period": "2026-05",
				},
			}),
		);
		expect(response.status).toBe(200);
	});

	it("replays one aggregate with complete evidence", async () => {
		nodes.set("node-1", node());
		events.set("evt-1", event());
		const response = await app.handle(
			new Request("http://localhost/fiscal-truth/replay/inv-1", {
				headers: {
					"x-company-id": "cmp-1",
					"x-company-ruc": "20100070970",
					"x-fiscal-period": "2026-05",
				},
			}),
		);
		expect(response.status).toBe(200);
	});

	it("rejects tenant mismatch between header scope and payload scope", async () => {
		const response = await app.handle(
			new Request("http://localhost/fiscal-truth/append", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-999",
					"x-company-ruc": "20100070970",
					"x-fiscal-period": "2026-05",
				},
				body: JSON.stringify({
					evidence: node(),
					event: event(),
					validatorResults: [],
					policyDecision: policy(),
					hasRequiredApproval: true,
				}),
			}),
		);
		expect(response.status).toBe(403);
	});

	it("blocks append when governance bundle is not approved", async () => {
		const blocked = { ...policy(), governance: governance("rejected") };
		const response = await app.handle(
			new Request("http://localhost/fiscal-truth/append", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-company-ruc": "20100070970",
					"x-fiscal-period": "2026-05",
				},
				body: JSON.stringify({
					evidence: node(),
					event: event(),
					validatorResults: [],
					policyDecision: blocked,
					hasRequiredApproval: true,
				}),
			}),
		);
		expect(response.status).toBe(409);
	});

	it("rejects append when evidence root id mismatches persisted evidence node id", async () => {
		const baseEvent = event();
		const mismatchedEvent = {
			...baseEvent,
			evidenceRootNodeId: "node-root",
			payload: {
				provenance: {
					validatorResults: [
						{
							validatorName: "sunat",
							validatorVersion: "validators-v1",
							inputHash: "h",
							isValid: true,
							code: "VALIDATION_OK",
							reason: "ok",
							severity: "info",
							observedAt: "2026-05-04T00:00:00.000Z",
							payload: {},
						},
					],
					policyDecision: policy(),
					governance: governance("approved"),
					approval: { required: true, approvalId: "approval-1" },
					evidence: {
						rootNodeId: "node-root",
						bundleHash: "hash-bundle",
						nodeId: "node-1",
						nodeHash: "hash-bundle",
					},
				},
			},
		};

		const response = await app.handle(
			new Request("http://localhost/fiscal-truth/append", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-company-ruc": "20100070970",
				},
				body: JSON.stringify({
					evidence: node(),
					event: mismatchedEvent,
					validatorResults: [
						{
							validatorName: "sunat",
							validatorVersion: "validators-v1",
							inputHash: "h",
							isValid: true,
							code: "VALIDATION_OK",
							reason: "ok",
							severity: "info",
							observedAt: "2026-05-04T00:00:00.000Z",
							payload: {},
						},
					],
					policyDecision: policy(),
					hasRequiredApproval: true,
				}),
			}),
		);

		expect(response.status).toBe(400);
	});

	it("rejects append when evidence root cannot be resolved from repository lookup", async () => {
		const isolatedNodes = new Map<string, EvidenceNode>();
		const isolatedEvents = new Map<string, FiscalTruthEvent>();
		const isolatedApp = new Elysia().use(
			createFiscalTruthModule({
				evidenceRepository: {
					appendNode: vi.fn(
						async (n: EvidenceNode) => void isolatedNodes.set(n.nodeId, n),
					),
					appendEdge: vi.fn(async () => undefined),
					findNodeById: vi.fn(async () => null),
					findEdgesFromNode: vi.fn(async () => []),
				},
				fiscalTruthRepository: {
					append: vi.fn(
						async (e: FiscalTruthEvent) =>
							void isolatedEvents.set(e.eventId, e),
					),
					findByEventId: vi.fn(async () => null),
					findByAggregateId: vi.fn(async () => []),
				},
				replayRepository: {
					loadEventChain: vi.fn(async () => []),
					saveReplayResult: vi.fn(async () => undefined),
				},
				governanceVerifier: {
					verify: vi.fn(async () => true),
				},
			}),
		);

		const response = await isolatedApp.handle(
			new Request("http://localhost/fiscal-truth/append", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-company-ruc": "20100070970",
					"x-fiscal-period": "2026-05",
				},
				body: JSON.stringify({
					evidence: node(),
					event: event(),
					validatorResults: [
						{
							validatorName: "sunat",
							validatorVersion: "validators-v1",
							inputHash: "h",
							isValid: true,
							code: "VALIDATION_OK",
							reason: "ok",
							severity: "info",
							observedAt: "2026-05-04T00:00:00.000Z",
							payload: {},
						},
					],
					policyDecision: policy(),
					hasRequiredApproval: true,
				}),
			}),
		);

		expect(response.status).toBe(400);
		expect(isolatedEvents.size).toBe(0);
	});
});
