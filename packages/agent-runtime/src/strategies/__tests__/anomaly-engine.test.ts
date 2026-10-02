import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentEventBus } from "../../mastra/event-bus";
import type { AgentContext } from "../../types/agent-context";
import { FiscalAnomalyEngine } from "../anomaly-engine";
import type { Anomaly, AnomalyStrategy } from "../types";

const mockContext: AgentContext = {
	tenantId: "test",
	userId: "test",
	organizationId: "test",
	companyId: "test",
	ruc: "20123456789",
	traceId: "test",
};

// ─── Fixture strategies ───────────────────────────────────────────

function createMockStrategy(
	id: string,
	anomalies: Anomaly[] = [],
): AnomalyStrategy {
	return {
		id,
		name: `Strategy ${id}`,
		description: `Mock strategy for ${id}`,
		execute: vi.fn().mockResolvedValue(anomalies),
	};
}

function createErrorStrategy(id: string): AnomalyStrategy {
	return {
		id,
		name: `Error Strategy ${id}`,
		description: `Strategy that throws`,
		execute: vi.fn().mockRejectedValue(new Error("Strategy crashed")),
	};
}

const sampleAnomaly: Anomaly = {
	id: "test-001",
	timestamp: new Date().toISOString(),
	entityType: "invoice",
	entityId: "INV-001",
	metric: "test_metric",
	expectedValue: 100,
	actualValue: 200,
	deviation: 1,
	severity: "high",
	confidence: 0.95,
	reasoning: "Test anomaly",
	detectionMethod: "test_method",
	context: {},
};

// ─── Tests ─────────────────────────────────────────────────────────

describe("FiscalAnomalyEngine", () => {
	describe("construction", () => {
		it("should create engine without strategies", () => {
			const engine = new FiscalAnomalyEngine();
			expect(engine.listStrategies()).toEqual([]);
		});

		it("should create engine with initial strategies", () => {
			const s1 = createMockStrategy("s1");
			const engine = new FiscalAnomalyEngine([s1]);
			expect(engine.listStrategies()).toHaveLength(1);
		});
	});

	describe("strategy lifecycle", () => {
		let engine: FiscalAnomalyEngine;

		beforeEach(() => {
			engine = new FiscalAnomalyEngine();
		});

		it("should add and list strategies", () => {
			engine.addStrategy(createMockStrategy("s1"));
			engine.addStrategy(createMockStrategy("s2"));
			expect(engine.listStrategies()).toHaveLength(2);
		});

		it("should get strategy by id", () => {
			const s1 = createMockStrategy("s1");
			engine.addStrategy(s1);
			expect(engine.getStrategy("s1")).toBe(s1);
		});

		it("should return undefined for unknown strategy", () => {
			expect(engine.getStrategy("unknown")).toBeUndefined();
		});

		it("should remove strategy", () => {
			engine.addStrategy(createMockStrategy("s1"));
			expect(engine.removeStrategy("s1")).toBe(true);
			expect(engine.listStrategies()).toHaveLength(0);
		});

		it("should return false when removing unknown strategy", () => {
			expect(engine.removeStrategy("unknown")).toBe(false);
		});

		it("should replace strategy with same id", () => {
			const s1 = createMockStrategy("s1", [sampleAnomaly]);
			const s2 = createMockStrategy("s1", []);
			engine.addStrategy(s1);
			engine.replaceStrategy(s2);
			expect(engine.getStrategy("s1")).toBe(s2);
		});
	});

	describe("runAll", () => {
		it("should run all strategies and collect results", async () => {
			const s1 = createMockStrategy("s1", [sampleAnomaly]);
			const s2 = createMockStrategy("s2", []);
			const engine = new FiscalAnomalyEngine([s1, s2]);

			const results = await engine.runAll([], mockContext);
			expect(results).toHaveLength(2);
			expect(results[0].strategyId).toBe("s1");
			expect(results[0].anomalies).toHaveLength(1);
			expect(results[1].strategyId).toBe("s2");
			expect(results[1].anomalies).toHaveLength(0);
		});

		it("should isolate strategy errors", async () => {
			const s1 = createMockStrategy("s1", [sampleAnomaly]);
			const sError = createErrorStrategy("error-strategy");
			const engine = new FiscalAnomalyEngine([s1, sError]);

			const results = await engine.runAll([], mockContext);
			expect(results).toHaveLength(2);
			expect(results[0].anomalies).toHaveLength(1);
			expect(results[1].error).toBe("Strategy crashed");
			expect(results[1].anomalies).toHaveLength(0);
		});
	});

	describe("runAllFlat", () => {
		it("should return flat deduplicated anomalies", async () => {
			const a1: Anomaly = {
				...sampleAnomaly,
				id: "a1",
				entityId: "INV-001",
				metric: "test",
				severity: "medium",
			};
			const a2: Anomaly = {
				...sampleAnomaly,
				id: "a2",
				entityId: "INV-001",
				metric: "test",
				severity: "critical", // higher severity
			};

			const s1 = createMockStrategy("s1", [a1]);
			const s2 = createMockStrategy("s2", [a2]);
			const engine = new FiscalAnomalyEngine([s1, s2]);

			const flat = await engine.runAllFlat([], mockContext);
			expect(flat).toHaveLength(1);
			expect(flat[0].severity).toBe("critical"); // kept highest
			expect(flat[0].id).toBe("a2");
		});

		it("should keep different entity+metric combinations separate", async () => {
			const a1: Anomaly = {
				...sampleAnomaly,
				id: "a1",
				entityId: "INV-001",
				metric: "m1",
			};
			const a2: Anomaly = {
				...sampleAnomaly,
				id: "a2",
				entityId: "INV-002",
				metric: "m1",
			};
			const engine = new FiscalAnomalyEngine([
				createMockStrategy("s1", [a1, a2]),
			]);

			const flat = await engine.runAllFlat([], mockContext);
			expect(flat).toHaveLength(2);
		});
	});

	describe("runStrategy", () => {
		it("should run specific strategy by id", async () => {
			const s1 = createMockStrategy("s1", [sampleAnomaly]);
			const engine = new FiscalAnomalyEngine([s1]);

			const result = await engine.runStrategy("s1", [], mockContext);
			expect(result.anomalies).toHaveLength(1);
		});

		it("should return error result for unknown strategy", async () => {
			const engine = new FiscalAnomalyEngine();
			const result = await engine.runStrategy("unknown", [], mockContext);
			expect(result.error).toContain("not found");
		});
	});

	describe("event bus integration", () => {
		it("should publish anomalies that meet threshold", async () => {
			const publishSpy = vi.fn();
			const eventBus = new AgentEventBus();
			eventBus.publish = publishSpy;

			const s1 = createMockStrategy("s1", [sampleAnomaly]); // high severity
			const engine = new FiscalAnomalyEngine([s1], eventBus, {
				publishThreshold: "medium",
			});

			await engine.runAll([], mockContext);

			// Should have published for the high-severity anomaly
			expect(publishSpy).toHaveBeenCalled();
			expect(publishSpy.mock.calls[0][0]).toBe("fiscal.anomaly.detected");
		});

		it("should NOT publish anomalies below threshold", async () => {
			const publishSpy = vi.fn();
			const eventBus = new AgentEventBus();
			eventBus.publish = publishSpy;

			const lowAnomaly: Anomaly = {
				...sampleAnomaly,
				severity: "low",
			};
			const s1 = createMockStrategy("s1", [lowAnomaly]);
			const engine = new FiscalAnomalyEngine([s1], eventBus, {
				publishThreshold: "medium",
			});

			await engine.runAll([], mockContext);

			expect(publishSpy).not.toHaveBeenCalled();
		});

		it("should not require event bus", async () => {
			const s1 = createMockStrategy("s1", [sampleAnomaly]);
			const engine = new FiscalAnomalyEngine([s1]);

			const results = await engine.runAll([], mockContext);
			expect(results[0].anomalies).toHaveLength(1);
		});
	});

	describe("performance tracking", () => {
		it("should track duration when enabled", async () => {
			const s1 = createMockStrategy("s1", [sampleAnomaly]);
			const engine = new FiscalAnomalyEngine([s1], undefined, {
				trackPerformance: true,
			});

			const results = await engine.runAll([], mockContext);
			expect(results[0].durationMs).toBeGreaterThanOrEqual(0);
		});

		it("should report zero duration when disabled", async () => {
			const s1 = createMockStrategy("s1", [sampleAnomaly]);
			const engine = new FiscalAnomalyEngine([s1]);

			const results = await engine.runAll([], mockContext);
			expect(results[0].durationMs).toBe(0);
		});
	});

	describe("minSeverity filtering", () => {
		it("should filter anomalies below strategy minSeverity", async () => {
			const lowAnomaly: Anomaly = {
				...sampleAnomaly,
				severity: "low",
			};
			const s1: AnomalyStrategy = {
				id: "s1",
				name: "High-only strategy",
				description: "Only reports medium+ anomalies",
				minSeverity: "medium",
				execute: vi.fn().mockResolvedValue([lowAnomaly]),
			};
			const engine = new FiscalAnomalyEngine([s1]);

			const results = await engine.runAll([], mockContext);
			expect(results[0].anomalies).toHaveLength(0);
		});
	});
});
