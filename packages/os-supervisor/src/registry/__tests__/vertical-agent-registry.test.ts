import { describe, expect, it } from "vitest";
import type { OSAgentPort, OSIntent } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import { VerticalAgentRegistry } from "../vertical-agent-registry.js";

function createMockAgent(vertical: VerticalType, id: string): OSAgentPort {
	return {
		id,
		name: `Agent ${id}`,
		description: `Mock agent for ${vertical}`,
		vertical,
		capabilities: [],
		execute: async () => ({
			success: true,
			data: null,
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
		}),
	};
}

describe("VerticalAgentRegistry", () => {
	it("should register and retrieve an agent", () => {
		const registry = new VerticalAgentRegistry();
		const agent = createMockAgent(VerticalType.DRENYRA, "drenyra-main");
		registry.register(agent);
		expect(registry.getByVertical(VerticalType.DRENYRA)).toHaveLength(1);
		expect(registry.getByVertical(VerticalType.DRENYRA)[0]?.id).toBe(
			"drenyra-main",
		);
	});

	it("should resolve intent to correct vertical agent", () => {
		const registry = new VerticalAgentRegistry();
		const drenyra = createMockAgent(VerticalType.DRENYRA, "drenyra-main");
		const andino = createMockAgent(VerticalType.ANDINO, "andino-main");
		registry.register(drenyra);
		registry.register(andino);

		const intent: OSIntent = {
			vertical: VerticalType.ANDINO,
			action: "drone-status",
			confidence: 0.9,
			originalInput: "drone status",
		};
		const resolved = registry.resolve(intent);
		expect(resolved).toBeDefined();
		expect(resolved?.id).toBe("andino-main");
	});

	it("should throw on duplicate agent id", () => {
		const registry = new VerticalAgentRegistry();
		const agent = createMockAgent(VerticalType.DRENYRA, "dup-id");
		registry.register(agent);
		expect(() => registry.register(agent)).toThrow("already registered");
	});

	it("should list all registered agents", () => {
		const registry = new VerticalAgentRegistry();
		registry.register(createMockAgent(VerticalType.DRENYRA, "d1"));
		registry.register(createMockAgent(VerticalType.ANDINO, "a1"));
		registry.register(createMockAgent(VerticalType.ADMIN, "adm1"));
		expect(registry.list()).toHaveLength(3);
	});

	it("should return empty array for vertical with no agents", () => {
		const registry = new VerticalAgentRegistry();
		expect(registry.getByVertical(VerticalType.KUSE)).toEqual([]);
	});

	it("should return all registered vertical types", () => {
		const registry = new VerticalAgentRegistry();
		expect(registry.getRegisteredVerticals()).toEqual([]);
		registry.register(createMockAgent(VerticalType.DRENYRA, "d1"));
		registry.register(createMockAgent(VerticalType.ANDINO, "a1"));
		const verticals = registry.getRegisteredVerticals();
		expect(verticals).toContain(VerticalType.DRENYRA);
		expect(verticals).toContain(VerticalType.ANDINO);
		expect(verticals).not.toContain(VerticalType.KUSE);
	});
});
