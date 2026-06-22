import { describe, expect, it } from "vitest";
import {
	buildDrenyraDualSurfaceContract,
	DRENYRA_CONTRACT_VERSION,
	DRENYRA_IDEMPOTENCY_HEADER,
	DRENYRA_REQUIRED_SCOPE_HEADERS,
	DRENYRA_SSE_EVENT_TYPES,
} from "../contracts";

describe("Drenyra Dual Surface Contract", () => {
	it("returns the expected contract version", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.version).toBe(DRENYRA_CONTRACT_VERSION);
	});

	it("has the correct platform category", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.platformCategory).toBe(
			"ai_augmented_fiscal_sovereignty_platform",
		);
	});

	it("declares source of truth references", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.sourceOfTruth).toBe("apps/api");
		expect(contract.sharedDomain).toBe("packages/domain/src/drenyra");
		expect(contract.sharedApplication).toBe("packages/application/src/drenyra");
	});

	it("exports 5 required scope headers", () => {
		expect(DRENYRA_REQUIRED_SCOPE_HEADERS).toHaveLength(5);
		expect(DRENYRA_REQUIRED_SCOPE_HEADERS).toContain("x-organization-id");
		expect(DRENYRA_REQUIRED_SCOPE_HEADERS).toContain("x-company-id");
		expect(DRENYRA_REQUIRED_SCOPE_HEADERS).toContain("x-company-ruc");
		expect(DRENYRA_REQUIRED_SCOPE_HEADERS).toContain("x-fiscal-period");
		expect(DRENYRA_REQUIRED_SCOPE_HEADERS).toContain("x-user-id");
	});

	it("defines the idempotency header", () => {
		expect(DRENYRA_IDEMPOTENCY_HEADER).toBe("x-idempotency-key");
	});

	it("defines 11 SSE event types", () => {
		expect(DRENYRA_SSE_EVENT_TYPES).toHaveLength(11);
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("connected");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("heartbeat");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("intent");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("token");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("result");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("snapshot");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("approval.new");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("approval.updated");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("approval.resolved");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("error");
		expect(DRENYRA_SSE_EVENT_TYPES).toContain("done");
	});

	it("has 5 endpoints with correct HTTP methods and paths", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.endpoints).toHaveLength(5);

		const getContract = contract.endpoints[0];
		expect(getContract.method).toBe("GET");
		expect(getContract.path).toBe("/api/drenyra/contract");

		const getCases = contract.endpoints[1];
		expect(getCases.method).toBe("GET");
		expect(getCases.path).toBe("/api/drenyra/cases");

		const inspectWork = contract.endpoints[2];
		expect(inspectWork.method).toBe("GET");
		expect(inspectWork.path).toBe(
			"/api/drenyra/fiscal-work/:workItemId/inspect",
		);

		const postCases = contract.endpoints[3];
		expect(postCases.method).toBe("POST");
		expect(postCases.path).toBe("/api/drenyra/cases");

		const brainEvents = contract.endpoints[4];
		expect(brainEvents.method).toBe("GET");
		expect(brainEvents.path).toBe(
			"/api/drenyra/brain/threads/:threadId/events",
		);
		expect(brainEvents.sseEvents).toContain("heartbeat");
	});

	it("sets idempotentReplay for 4 of 5 endpoints", () => {
		const contract = buildDrenyraDualSurfaceContract();
		const idempotent = contract.endpoints.filter(
			(e) => e.idempotentReplay,
		);
		expect(idempotent).toHaveLength(4);
	});

	it("requires CLI and web parity for all endpoints", () => {
		const contract = buildDrenyraDualSurfaceContract();
		for (const endpoint of contract.endpoints) {
			expect(endpoint.cliParity).toBe("required");
			expect(endpoint.webParity).toBe("required");
		}
	});

	it("denies capabilities by default in agent governance", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.agentGovernance.denyByDefault).toBe(true);
		expect(
			contract.agentGovernance.materialFiscalActionsRequireHumanApproval,
		).toBe(true);
		expect(contract.agentGovernance.redactionFailureMode).toBe("deny");
	});

	it("defines 6 capability manifest fields", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.agentGovernance.capabilityManifestFields).toHaveLength(6);
		expect(
			contract.agentGovernance.capabilityManifestFields,
		).toContain("toolName");
		expect(
			contract.agentGovernance.capabilityManifestFields,
		).toContain("redactionRequired");
	});

	it("lists 5 offline command kinds", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.offlineCommandKinds).toHaveLength(5);
		expect(contract.offlineCommandKinds).toContain("CREATE_FISCAL_CASE");
		expect(contract.offlineCommandKinds).toContain("ADD_EVIDENCE");
		expect(contract.offlineCommandKinds).toContain("START_AGENT_RUN");
		expect(contract.offlineCommandKinds).toContain("REQUEST_APPROVAL");
		expect(contract.offlineCommandKinds).toContain("DECIDE_APPROVAL");
	});

	it("documents 4 invariants", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.invariants).toHaveLength(4);
	});

	it("is deterministic (same call produces identical output)", () => {
		const a = buildDrenyraDualSurfaceContract();
		const b = buildDrenyraDualSurfaceContract();
		expect(a).toEqual(b);
	});

	it("provides fiscal case statuses and types from domain", () => {
		const contract = buildDrenyraDualSurfaceContract();
		expect(contract.allowedFiscalCaseStatuses.length).toBeGreaterThan(0);
		expect(contract.allowedFiscalCaseTypes.length).toBeGreaterThan(0);
		expect(contract.allowedEvidenceTypes.length).toBeGreaterThan(0);
		expect(contract.allowedAgentTypes.length).toBeGreaterThan(0);
	});
});
