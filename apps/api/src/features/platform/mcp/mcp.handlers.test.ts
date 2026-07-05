import type { DrenyraMcpScope } from "@drenyra/agents";
import {
	EVIDENCE_EDGE_KIND,
	EVIDENCE_NODE_KIND,
	type EvidenceNode,
} from "@drenyra/agents";
import { describe, expect, it, vi } from "vitest";
import { createPlatformMcpHandlers } from "./mcp.handlers";

const scope: DrenyraMcpScope = {
	organizationId: "10",
	companyId: "company-001",
	companyRuc: "20100070970",
	period: "2026-05",
	countryCode: "PE",
	userId: "user-001",
};

const evidenceNode: EvidenceNode = {
	nodeId: "node-001",
	nodeKind: EVIDENCE_NODE_KIND.SOURCE_INPUT,
	scope: {
		companyId: scope.companyId,
		companyRuc: scope.companyRuc,
		organizationId: 10,
		period: scope.period,
		countryCode: "PE",
	},
	trace: {
		traceId: "trace-001",
		correlationId: "thread-001",
		causationId: null,
	},
	hash: "hash-001",
	createdAt: "2026-05-26T00:00:00.000Z",
	metadata: {
		platform: "drenyra-brain",
		threadId: "thread-001",
		actorId: "secret-user",
	},
};

describe("Platform MCP handlers", () => {
	it("returns Drenyra contract for read handler", async () => {
		const invoke = createPlatformMcpHandlers();
		const result = await invoke({
			toolName: "drenyra.contract.read",
			scope,
			arguments: {},
		});

		expect(result).toMatchObject({ sourceOfTruth: "apps/api" });
	});

	it("lists Brain threads from injected scoped repository", async () => {
		const listThreads = vi
			.fn()
			.mockResolvedValue([{ id: "thread-001", title: "Scoped" }]);
		const invoke = createPlatformMcpHandlers({
			brainRepository: { listThreads },
		});

		const result = await invoke({
			toolName: "drenyra.brain.list_threads",
			scope,
			arguments: {},
		});

		expect(result).toEqual([{ id: "thread-001", title: "Scoped" }]);
		expect(listThreads).toHaveBeenCalledWith({
			organizationId: "10",
			companyId: "company-001",
			companyRuc: "20100070970",
			period: "2026-05",
			countryCode: "PE",
		});
	});

	it("reads evidence graph metadata and redacts unsafe metadata", async () => {
		const findNodeById = vi.fn().mockResolvedValue(evidenceNode);
		const findEdgesFromNode = vi.fn().mockResolvedValue([
			{
				edgeId: "edge-001",
				fromNodeId: "node-001",
				toNodeId: "node-root",
				edgeKind: EVIDENCE_EDGE_KIND.DERIVES_FROM,
				scope: evidenceNode.scope,
				createdAt: evidenceNode.createdAt,
			},
		]);
		const invoke = createPlatformMcpHandlers({
			evidenceGraph: { findNodeById, findEdgesFromNode },
		});

		const result = await invoke({
			toolName: "fiscal_truth.evidence.read_graph",
			scope,
			arguments: { nodeId: "node-001" },
		});

		expect(result).toMatchObject({
			node: { metadata: { platform: "drenyra-brain", threadId: "thread-001" } },
		});
		expect(JSON.stringify(result)).not.toContain("secret-user");
	});
});
