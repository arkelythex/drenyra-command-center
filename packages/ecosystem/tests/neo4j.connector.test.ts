import { describe, expect, it, vi } from "vitest";
import { Neo4jConnector } from "../src/adapters/neo4j/neo4j.connector";
import type { Neo4jOperation } from "../src/adapters/neo4j/neo4j.types";
import { CircuitBreakerOpenError } from "../src/base.connector";

function createMockDriver() {
	const mockSession = {
		run: vi.fn(),
		executeWrite: vi.fn(),
		close: vi.fn(),
	};
	return {
		session: vi.fn(() => mockSession),
		verifyConnectivity: vi.fn(),
		close: vi.fn(),
		mockSession,
	};
}

class TestNeo4jConnector extends Neo4jConnector {
	readonly mockDriver: ReturnType<typeof createMockDriver>;

	constructor() {
		super();
		this.mockDriver = createMockDriver();
		this.driver = this.mockDriver;
	}

	protected override async createDriver() {
		return this.mockDriver;
	}
}

describe("Neo4jConnector", () => {
	it("connects and reports healthy", async () => {
		const c = new TestNeo4jConnector();
		await c.connect();
		const health = await c.isHealthy();
		expect(health.connected).toBe(true);
	});

	it("disconnects and closes driver", async () => {
		const c = new TestNeo4jConnector();
		await c.connect();
		await c.disconnect();
		expect(c.mockDriver.close).toHaveBeenCalledOnce();
		const health = await c.isHealthy();
		expect(health.connected).toBe(false);
	});

	it("rejects connect when driver fails to verify", async () => {
		const c = new TestNeo4jConnector();
		c.mockDriver.verifyConnectivity.mockRejectedValue(
			new Error("Connection refused"),
		);
		await expect(c.connect()).rejects.toThrow("Connection refused");
		const health = await c.isHealthy();
		expect(health.connected).toBe(false);
	});

	it("executes a graph.query operation", async () => {
		const c = new TestNeo4jConnector();
		c.mockDriver.session.mockReturnValue({
			run: vi.fn().mockResolvedValue({
				records: [{ name: "Drenyra SAC", ruc: "20123456789" }],
				summary: {
					containsUpdates: () => false,
					counters: {
						nodesCreated: () => 0,
						nodesDeleted: () => 0,
						relationshipsCreated: () => 0,
						propertiesSet: () => 0,
					},
				},
			}),
			close: vi.fn(),
		});

		const op: Neo4jOperation = {
			type: "graph.query",
			cypher: "MATCH (c:Company {ruc: $ruc}) RETURN c",
			params: { ruc: "20123456789" },
		};
		const result = await c.execute<{ records: Array<unknown> }>(op);
		expect(result.records).toHaveLength(1);
		expect(result.records[0]).toMatchObject({ name: "Drenyra SAC" });
	});

	it("falls back to text search when vector index is unavailable for graphrag", async () => {
		const c = new TestNeo4jConnector();

		// First call (vector index) fails -> fallback to text search
		const sessionCall = vi
			.fn()
			.mockRejectedValueOnce(new Error("Vector index not found"))
			.mockResolvedValueOnce({
				records: [{ name: "Drenyra SAC", ruc: "20123456789" }],
				summary: {
					containsUpdates: () => false,
					counters: {
						nodesCreated: () => 0,
						nodesDeleted: () => 0,
						relationshipsCreated: () => 0,
						propertiesSet: () => 0,
					},
				},
			});

		c.mockDriver.session.mockReturnValue({
			run: sessionCall,
			close: vi.fn(),
		});

		const op: Neo4jOperation = {
			type: "graph.graphrag_search",
			query: "Drenyra",
			embedding: [0.1, 0.2, 0.3],
			topK: 5,
		};
		const result = await c.execute<{ nodes: Array<unknown>; score: number }>(
			op,
		);
		expect(result.nodes).toHaveLength(1);
		expect(result.score).toBe(0);
		expect(sessionCall).toHaveBeenCalledTimes(2);
	});

	it("trips circuit breaker on repeated failures", async () => {
		const c = new TestNeo4jConnector();
		c.mockDriver.session.mockReturnValue({
			run: vi.fn().mockRejectedValue(new Error("Connection lost")),
			close: vi.fn(),
		});

		// Use graph.query (calls session.run) instead of health (no-op)
		const op: Neo4jOperation = {
			type: "graph.query",
			cypher: "MATCH (n) RETURN n",
		};
		for (let i = 0; i < 4; i++) {
			await expect(c.execute(op)).rejects.toThrow("Connection lost");
		}

		// Circuit opens after auto-retry accelerates failure accumulation
		for (let i = 0; i < 5; i++) {
			await expect(c.execute(op)).rejects.toThrow(CircuitBreakerOpenError);
		}

		// Circuit breaker OPEN now
		await expect(c.execute(op)).rejects.toThrow(CircuitBreakerOpenError);
	});

	it("creates constraints on connect", async () => {
		const c = new TestNeo4jConnector();
		const runMock = vi.fn().mockResolvedValue({ records: [] });
		c.mockDriver.session.mockReturnValue({
			run: runMock,
			close: vi.fn(),
		});

		await c.connect();
		expect(runMock).toHaveBeenCalledTimes(3);
		expect(runMock).toHaveBeenCalledWith(
			"CREATE CONSTRAINT IF NOT EXISTS FOR (c:Company) REQUIRE c.ruc IS UNIQUE",
		);
		expect(runMock).toHaveBeenCalledWith(
			"CREATE CONSTRAINT IF NOT EXISTS FOR (i:Invoice) REQUIRE i.id IS UNIQUE",
		);
		expect(runMock).toHaveBeenCalledWith(
			"CREATE CONSTRAINT IF NOT EXISTS FOR (cu:Customer) REQUIRE cu.ruc IS UNIQUE",
		);
	});
});
