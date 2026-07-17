import { describe, expect, it } from "vitest";
import { GeneralizedIntentDetector } from "../intent/intent-detector.js";
import { VerticalAgentRegistry } from "../registry/vertical-agent-registry.js";
import { OSSupervisorAgent } from "../supervisor/os-supervisor-agent.js";
import type { OSAgentContext, OSAgentPort } from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

/** Mock agent that doesn't need API keys */
function createMockAgent(
	id: string,
	name: string,
	vertical: VerticalType,
	caps: string[],
): OSAgentPort {
	return {
		id,
		name,
		description: `Mock ${name} agent`,
		vertical,
		capabilities: caps,
		execute: async () => ({
			success: true,
			data: { message: `${name}: mock response` },
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			agentId: id,
		}),
	};
}

function createFullSupervisor(): OSSupervisorAgent {
	const registry = new VerticalAgentRegistry();
	const detector = new GeneralizedIntentDetector();

	registry.register(
		createMockAgent("andino-main", "Andino", VerticalType.ANDINO, [
			"drone:telemetry",
		]),
	);
	registry.register(
		createMockAgent("admin-main", "Admin", VerticalType.ADMIN, ["hr:employee"]),
	);
	registry.register(
		createMockAgent("edge-main", "Edge", VerticalType.EDGE_TRAZ_AGRO, [
			"trace:event",
		]),
	);
	registry.register(
		createMockAgent("kuse-main", "Kuse", VerticalType.KUSE, ["cowork:booking"]),
	);

	detector.registerVerticalRules(VerticalType.DRENYRA, [
		{
			pattern: /\b(invoice|factura|igv|sunat|tax|impuesto|contabilidad)\b/i,
			action: "fiscal",
			priority: 50,
		},
	]);

	detector.registerVerticalRules(VerticalType.ANDINO, [
		{
			pattern: /\b(drone|vuelo|flight|crop|cultivo|agricultura)\b/i,
			action: "drone",
			priority: 50,
		},
	]);

	detector.registerVerticalRules(VerticalType.ADMIN, [
		{
			pattern: /\b(employee|empleado|contract|contrato|nómina|payroll|hr)\b/i,
			action: "hr",
			priority: 50,
		},
	]);

	detector.registerVerticalRules(VerticalType.EDGE_TRAZ_AGRO, [
		{
			pattern: /\b(trace|trazabilidad|lote|lot|provenance|origen)\b/i,
			action: "trace",
			priority: 50,
		},
	]);

	detector.registerVerticalRules(VerticalType.KUSE, [
		{
			pattern:
				/\b(cowork|booking|reserva|espacio|space|membresía|membership)\b/i,
			action: "space",
			priority: 50,
		},
	]);

	return new OSSupervisorAgent(registry, detector);
}

const baseContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-1",
	vertical: VerticalType.DRENYRA,
};

describe("Cross-vertical integration", () => {
	it("should route Drenyra fiscal intents", async () => {
		const supervisor = createFullSupervisor();
		const result = await supervisor.handleInput(
			"show the latest invoice",
			baseContext,
		);
		expect(result.success).toBe(true);
	});

	it("should route Andino drone intents", async () => {
		const supervisor = createFullSupervisor();
		const result = await supervisor.handleInput(
			"check drone flight status",
			baseContext,
		);
		expect(result.success).toBe(true);
		expect(result.vertical).toBe(VerticalType.ANDINO);
		expect(result.agentId).toBe("andino-main");
	});

	it("should route Admin HR intents", async () => {
		const supervisor = createFullSupervisor();
		const result = await supervisor.handleInput(
			"find employee contract",
			baseContext,
		);
		expect(result.success).toBe(true);
		expect(result.vertical).toBe(VerticalType.ADMIN);
		expect(result.agentId).toBe("admin-main");
	});

	it("should route Edge trace intents", async () => {
		const supervisor = createFullSupervisor();
		const result = await supervisor.handleInput(
			"trace lot OR-2025-42",
			baseContext,
		);
		expect(result.success).toBe(true);
		expect(result.vertical).toBe(VerticalType.EDGE_TRAZ_AGRO);
		expect(result.agentId).toBe("edge-main");
	});

	it("should route Kuse cowork intents", async () => {
		const supervisor = createFullSupervisor();
		const result = await supervisor.handleInput(
			"cowork booking reservation",
			baseContext,
		);
		expect(result.success).toBe(true);
		expect(result.vertical).toBe(VerticalType.KUSE);
		expect(result.agentId).toBe("kuse-main");
	});

	it("should handle empty input gracefully", async () => {
		const supervisor = createFullSupervisor();
		const result = await supervisor.handleInput("", baseContext);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
	});
});
