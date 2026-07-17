import { describe, expect, it, vi } from "vitest";
import type { DifyOperation } from "../src/adapters/dify/dify.types";
import type { Neo4jOperation } from "../src/adapters/neo4j/neo4j.types";
import { ConnectorRegistry } from "../src/connector.registry";
import { DifyNeo4jOrchestrator } from "../src/orchestrators/dify-neo4j";

function createMockRegistry(
	neo4jExecute?: ReturnType<typeof vi.fn>,
	difyExecute?: ReturnType<typeof vi.fn>,
): ConnectorRegistry {
	const registry = new ConnectorRegistry();

	registry.register({
		name: "neo4j",
		config: {},
		connect: vi.fn(),
		disconnect: vi.fn(),
		isHealthy: vi.fn(),
		execute: neo4jExecute ?? vi.fn(),
	});

	registry.register({
		name: "dify",
		config: {},
		connect: vi.fn(),
		disconnect: vi.fn(),
		isHealthy: vi.fn(),
		execute: difyExecute ?? vi.fn(),
	});

	return registry;
}

describe("DifyNeo4jOrchestrator", () => {
	it("creates orchestrator with registry", () => {
		const registry = createMockRegistry();
		const orchestrator = new DifyNeo4jOrchestrator(registry);
		expect(orchestrator).toBeInstanceOf(DifyNeo4jOrchestrator);
	});

	it("analyze() calls neo4j first, then dify with context", async () => {
		const neo4jExecute = vi.fn().mockResolvedValue({
			records: [
				{
					n: { id: "20123456789", name: "Drenyra SAC", ruc: "20123456789" },
					nodeLabels: ["Company"],
					score: 0.95,
				},
			],
			summary: {
				containsUpdates: false,
				nodesCreated: 0,
				nodesDeleted: 0,
				relationshipsCreated: 0,
				propertiesSet: 0,
			},
		});

		const difyExecute = vi.fn().mockResolvedValue({
			answer:
				"Based on the fiscal context, this invoice should be classified as a purchase invoice.",
			conversation_id: "conv-abc",
			message_id: "msg-123",
			created_at: Date.now(),
		});

		const registry = createMockRegistry(neo4jExecute, difyExecute);
		const orchestrator = new DifyNeo4jOrchestrator(registry, {
			includeRelationships: false,
		});

		const result = await orchestrator.analyze({
			query: "¿Cómo clasifico esta factura?",
			companyRuc: "20123456789",
		});

		expect(neo4jExecute).toHaveBeenCalledOnce();
		expect(difyExecute).toHaveBeenCalledOnce();

		const difyCall = difyExecute.mock.calls[0][0] as DifyOperation & {
			inputs: Record<string, unknown>;
		};
		expect(difyCall.type).toBe("chat.message");
		expect(difyCall.inputs.graph_context).toBeTruthy();
		expect(difyCall.inputs.fiscal_query).toBe("¿Cómo clasifico esta factura?");
		expect(difyCall.inputs.company_ruc).toBe("20123456789");

		expect(result.graphContext.fiscalEntities).toHaveLength(1);
		expect(result.graphContext.fiscalEntities[0].id).toBe("20123456789");
		expect(result.difyResponse.answer).toContain("purchase invoice");
		expect(result.difyResponse.conversationId).toBe("conv-abc");
		expect(result.query).toBe("¿Cómo clasifico esta factura?");
		expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
	});

	it("graceful degradation when neo4j fails", async () => {
		const neo4jExecute = vi
			.fn()
			.mockRejectedValue(new Error("Neo4j connection refused"));

		const difyExecute = vi.fn().mockResolvedValue({
			answer:
				"No graph context available, but I can still provide analysis based on the query.",
			conversation_id: "conv-def",
			message_id: "msg-456",
			created_at: Date.now(),
		});

		const registry = createMockRegistry(neo4jExecute, difyExecute);
		const orchestrator = new DifyNeo4jOrchestrator(registry);

		const result = await orchestrator.analyze({
			query: "Analyze this invoice",
		});

		expect(neo4jExecute).toHaveBeenCalledOnce();
		expect(difyExecute).toHaveBeenCalledOnce();
		expect(result.graphContext.fiscalEntities).toHaveLength(0);
		expect(result.graphContext.relationships).toHaveLength(0);
		expect(result.difyResponse.answer).toContain("No graph context available");
	});

	it("graceful degradation when dify fails", async () => {
		const neo4jExecute = vi.fn().mockResolvedValue({
			records: [
				{
					n: { id: "entity-1", name: "Test Entity", ruc: "12345678901" },
					nodeLabels: ["TaxConcept"],
					score: 0.8,
				},
			],
			summary: {
				containsUpdates: false,
				nodesCreated: 0,
				nodesDeleted: 0,
				relationshipsCreated: 0,
				propertiesSet: 0,
			},
		});

		const difyExecute = vi
			.fn()
			.mockRejectedValue(new Error("Dify API rate limited"));

		const registry = createMockRegistry(neo4jExecute, difyExecute);
		const orchestrator = new DifyNeo4jOrchestrator(registry);

		const result = await orchestrator.analyze({
			query: "Rate limit test",
		});

		expect(result.graphContext.fiscalEntities).toHaveLength(1);
		expect(result.difyResponse.answer).toContain("Dify API rate limited");
		expect(result.difyResponse.conversationId).toBe("");
	});

	it("handles empty results", async () => {
		const neo4jExecute = vi.fn().mockResolvedValue({
			records: [],
			summary: {
				containsUpdates: false,
				nodesCreated: 0,
				nodesDeleted: 0,
				relationshipsCreated: 0,
				propertiesSet: 0,
			},
		});

		const difyExecute = vi.fn().mockResolvedValue({
			answer: "No fiscal entities found for the given query.",
			conversation_id: "conv-empty",
			message_id: "msg-empty",
			created_at: Date.now(),
		});

		const registry = createMockRegistry(neo4jExecute, difyExecute);
		const orchestrator = new DifyNeo4jOrchestrator(registry);

		const result = await orchestrator.analyze({
			query: "Unknown entity",
		});

		expect(result.graphContext.fiscalEntities).toHaveLength(0);
		expect(result.graphContext.relationships).toHaveLength(0);
		expect(result.difyResponse.answer).toBe(
			"No fiscal entities found for the given query.",
		);
	});

	it("truncates large graph context for dify inputs", async () => {
		// Build a large entity with lots of text to exceed 4000 chars
		const largeProperties: Record<string, string> = {};
		for (let i = 0; i < 100; i++) {
			largeProperties[`field_${i}`] = "x".repeat(100);
		}

		const neo4jExecute = vi.fn().mockImplementation((op: Neo4jOperation) => {
			if (
				op.type === "graph.query" &&
				(op as { cypher?: string }).cypher?.includes("MATCH (a)-[r]->(b)")
			) {
				return Promise.resolve({
					records: [],
					summary: {
						containsUpdates: false,
						nodesCreated: 0,
						nodesDeleted: 0,
						relationshipsCreated: 0,
						propertiesSet: 0,
					},
				});
			}
			return Promise.resolve({
				records: [1, 2, 3, 4, 5].map((i) => ({
					n: {
						id: `big-entity-${i}`,
						name: `Large Entity ${i}`,
						ruc: `20${i}23456789`,
						...largeProperties,
					},
					nodeLabels: ["Company"],
					score: 0.9,
				})),
				summary: {
					containsUpdates: false,
					nodesCreated: 0,
					nodesDeleted: 0,
					relationshipsCreated: 0,
					propertiesSet: 0,
				},
			});
		});

		const difyExecute = vi.fn().mockResolvedValue({
			answer: "Analysis complete.",
			conversation_id: "conv-trunc",
			message_id: "msg-trunc",
			created_at: Date.now(),
		});

		const registry = createMockRegistry(neo4jExecute, difyExecute);
		const orchestrator = new DifyNeo4jOrchestrator(registry);

		await orchestrator.analyze({ query: "Large context test" });

		const difyCall = difyExecute.mock.calls[0][0] as DifyOperation & {
			inputs: Record<string, unknown>;
		};
		const contextStr = difyCall.inputs.graph_context as string;
		expect(contextStr.length).toBeLessThanOrEqual(4000);
	});

	it("uses custom config overrides", () => {
		const registry = createMockRegistry();
		const orchestrator = new DifyNeo4jOrchestrator(registry, {
			neo4jMaxResults: 25,
			includeRelationships: false,
			minGraphConfidence: 0.8,
		});

		const config = orchestrator.getConfig();
		expect(config.neo4jMaxResults).toBe(25);
		expect(config.includeRelationships).toBe(false);
		expect(config.minGraphConfidence).toBe(0.8);
	});

	it("uses dummy registry test — no actual connection needed", async () => {
		// A registry with connectors that don't connect to any real backend
		const registry = new ConnectorRegistry();

		registry.register({
			name: "neo4j",
			config: {},
			connect: vi.fn(),
			disconnect: vi.fn(),
			isHealthy: vi.fn().mockResolvedValue({
				connected: false,
				latencyMs: 0,
				errorRate: 1,
				status: "mock",
				lastChecked: "",
			}),
			execute: vi.fn().mockResolvedValue({
				records: [],
				summary: {
					containsUpdates: false,
					nodesCreated: 0,
					nodesDeleted: 0,
					relationshipsCreated: 0,
					propertiesSet: 0,
				},
			}),
		});

		registry.register({
			name: "dify",
			config: {},
			connect: vi.fn(),
			disconnect: vi.fn(),
			isHealthy: vi.fn().mockResolvedValue({
				connected: false,
				latencyMs: 0,
				errorRate: 1,
				status: "mock",
				lastChecked: "",
			}),
			execute: vi.fn().mockResolvedValue({
				answer: "Mock analysis",
				conversation_id: "conv-mock",
				message_id: "msg-mock",
				created_at: Date.now(),
			}),
		});

		const orchestrator = new DifyNeo4jOrchestrator(registry, {
			neo4jMaxResults: 5,
		});
		const result = await orchestrator.analyze({ query: "Dummy test" });

		expect(result.graphContext).toBeDefined();
		expect(result.difyResponse.answer).toBe("Mock analysis");
		expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
	});
});
