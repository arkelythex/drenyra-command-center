import { PlatformEventBus, PlatformEventTypes } from "@arkelythex/core/events";
import { describe, expect, it } from "vitest";
import { OSApprovalGateEngine } from "../approval/approval-gate-engine.js";
import { InMemoryApprovalStore } from "../approval/approval-store.js";
import { GeneralizedIntentDetector } from "../intent/intent-detector.js";
import { VerticalAgentRegistry } from "../registry/vertical-agent-registry.js";
import { OSSupervisorAgent } from "../supervisor/os-supervisor-agent.js";
import type { OSAgentPort } from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

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

describe("NATS bridge integration", () => {
	it("should publish events through in-memory event bus (no NATS)", async () => {
		const bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		registry.register(
			createMockAgent("drenyra-main", "Drenyra", VerticalType.DRENYRA, [
				"fiscal:invoice",
			]),
		);
		registry.register(
			createMockAgent("admin-main", "Admin", VerticalType.ADMIN, [
				"hr:command",
			]),
		);

		const detector = new GeneralizedIntentDetector();
		detector.registerVerticalRules(VerticalType.ADMIN, [
			{ pattern: /\bemployee\b/, action: "hr-command", priority: 10 },
		]);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			eventBus: bus,
		});

		const received: Array<string> = [];
		bus.subscribe(PlatformEventTypes.OsAgentExecuted, (e) => {
			received.push(e.type);
		});

		const result = await supervisor.handleInput("find employee contract", {
			userId: "u1",
			tenantId: "t1",
			organizationId: "o1",
			companyId: "c1",
			ruc: "20123456789",
			traceId: "tr1",
			vertical: VerticalType.DRENYRA,
		});

		expect(result.success).toBe(true);
		expect(received).toContain(PlatformEventTypes.OsAgentExecuted);
	});

	it("should publish approval events through the gate engine", async () => {
		const bus = new PlatformEventBus();
		const store = new InMemoryApprovalStore();
		const gate = new OSApprovalGateEngine(store, undefined, bus);
		const registry = new VerticalAgentRegistry();
		const drenyra = createMockAgent(
			"drenyra-main",
			"Drenyra",
			VerticalType.DRENYRA,
			["fiscal:invoice"],
		);
		drenyra.approvalLevel = "gate";
		registry.register(drenyra);

		const detector = new GeneralizedIntentDetector();

		const supervisor = new OSSupervisorAgent(registry, detector, {
			eventBus: bus,
			approvalGate: gate,
		});

		const received: Array<string> = [];
		bus.subscribe(PlatformEventTypes.OsApprovalRequested, (e) => {
			received.push(e.type);
		});

		await supervisor.handleInput("test input", {
			userId: "u1",
			tenantId: "t1",
			organizationId: "o1",
			companyId: "c1",
			ruc: "20123456789",
			traceId: "tr1",
		});

		expect(received).toContain(PlatformEventTypes.OsApprovalRequested);
	});

	it("should correlate events via traceId", async () => {
		const bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		registry.register(
			createMockAgent("drenyra-main", "Drenyra", VerticalType.DRENYRA, [
				"fiscal:invoice",
			]),
		);
		const detector = new GeneralizedIntentDetector();
		const supervisor = new OSSupervisorAgent(registry, detector, {
			eventBus: bus,
		});

		const received: Array<{ correlationId: string }> = [];
		bus.subscribe(PlatformEventTypes.OsAgentExecuted, (e) => {
			received.push({ correlationId: e.correlationId });
		});

		await supervisor.handleInput("test", {
			userId: "u1",
			tenantId: "t1",
			organizationId: "o1",
			companyId: "c1",
			ruc: "20123456789",
			traceId: "trace-abc-123",
		});

		expect(received.length).toBe(1);
		expect(received[0].correlationId).toBe("trace-abc-123");
	});
});
