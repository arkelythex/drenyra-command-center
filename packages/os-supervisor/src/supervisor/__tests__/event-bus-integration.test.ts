import { PlatformEventBus, PlatformEventTypes } from "@arkelythex/core/events";
import { describe, expect, it } from "vitest";
import { OSApprovalGateEngine } from "../../approval/approval-gate-engine.js";

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

import { InMemoryApprovalStore } from "../../approval/approval-store.js";
import { GeneralizedIntentDetector } from "../../intent/intent-detector.js";
import { VerticalAgentRegistry } from "../../registry/vertical-agent-registry.js";
import type { OSAgentContext, OSAgentPort } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import { OSSupervisorAgent } from "../os-supervisor-agent.js";

const baseContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-1",
	vertical: VerticalType.DRENYRA,
};

describe("OSSupervisorAgent event bus integration", () => {
	it("should publish os.agent.executed after successful execution", async () => {
		const bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		registry.register(
			createMockAgent("andino-main", "Andino", VerticalType.ANDINO, [
				"drone:telemetry",
			]),
		);

		detector.registerVerticalRules(VerticalType.ANDINO, [
			{
				pattern: /\b(drone|vuelo|cultivo|crop)\b/i,
				action: "telemetry",
				priority: 50,
			},
		]);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			eventBus: bus,
		});

		const received: Array<{ type: string; payload: unknown }> = [];
		await bus.subscribe(PlatformEventTypes.OsAgentExecuted, (event) => {
			received.push({ type: event.type, payload: event.payload });
		});

		const result = await supervisor.handleInput("fly the drone", baseContext);

		expect(result.success).toBe(true);
		expect(received.length).toBe(1);
		expect(received[0].type).toBe(PlatformEventTypes.OsAgentExecuted);
		const payload = received[0].payload as Record<string, unknown>;
		expect(payload.vertical).toBe("andino");
		expect(payload.agentId).toBe("andino-main");
		expect(payload.success).toBe(true);
	});

	it("should NOT publish agent executed when input is empty", async () => {
		const bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		registry.register(
			createMockAgent("drenyra-main", "Drenyra", VerticalType.DRENYRA, [
				"fiscal:invoice",
			]),
		);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			eventBus: bus,
		});

		const received: Array<{ type: string }> = [];
		await bus.subscribe(PlatformEventTypes.OsAgentExecuted, (event) => {
			received.push({ type: event.type });
		});

		await supervisor.handleInput("", baseContext);

		expect(received.length).toBe(0);
	});

	it("should publish os.approval.requested when gate blocks", async () => {
		const bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		const gateAgent: OSAgentPort<unknown, { message: string }> = {
			id: "gate-agent",
			name: "Gate Agent",
			description: "Test agent requiring gate approval",
			vertical: VerticalType.DRENYRA,
			capabilities: ["test:gate"],
			approvalLevel: "gate",
			execute: async () => ({
				success: true,
				data: { message: "should not reach here" },
				metrics: { duration: 0, tokensUsed: 0, cost: 0 },
				agentId: "gate-agent",
			}),
		};

		registry.register(gateAgent);

		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{
				pattern: /\bgate-agent-test\b/i,
				action: "test",
				priority: 100,
			},
		]);

		const store = new InMemoryApprovalStore();
		const gate = new OSApprovalGateEngine(store, undefined, bus);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			eventBus: bus,
			approvalGate: gate,
		});

		const received: Array<{ type: string; payload: unknown }> = [];
		await bus.subscribe(PlatformEventTypes.OsApprovalRequested, (event) => {
			received.push({ type: event.type, payload: event.payload });
		});
		await bus.subscribe(PlatformEventTypes.OsAgentExecuted, (event) => {
			received.push({ type: event.type, payload: event.payload });
		});

		const result = await supervisor.handleInput("gate-agent-test", baseContext);

		expect(result.success).toBe(false);

		const approvalEvents = received.filter(
			(r) => r.type === PlatformEventTypes.OsApprovalRequested,
		);
		expect(approvalEvents.length).toBe(1);
		const payload = approvalEvents[0].payload as Record<string, unknown>;
		expect(payload.vertical).toBe("drenyra");
		expect(payload.toolName).toBe("gate-agent");
		expect(payload.approvalLevel).toBe("gate");

		const executedEvents = received.filter(
			(r) => r.type === PlatformEventTypes.OsAgentExecuted,
		);
		expect(executedEvents.length).toBe(0);
	});
});
