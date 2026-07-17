import { beforeEach, describe, expect, it } from "vitest";
import { OSApprovalGateEngine } from "../../approval/approval-gate-engine.js";
import { InMemoryApprovalStore } from "../../approval/approval-store.js";
import { GeneralizedIntentDetector } from "../../intent/intent-detector.js";
import { VerticalAgentRegistry } from "../../registry/vertical-agent-registry.js";
import { InMemoryAgentRunStore } from "../../traceability/in-memory-run-store.js";
import type { OSAgentContext, OSAgentPort } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import { OSSupervisorAgent } from "../os-supervisor-agent.js";

/** Inline agent that works without API keys — used for routing tests */
function createMockAgent(
	id: string,
	name: string,
	vertical: VerticalType,
	caps: string[],
): OSAgentPort {
	return {
		id,
		name,
		description: `Mock ${name} agent for testing`,
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

const baseContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-1",
	vertical: VerticalType.DRENYRA,
};

describe("OSSupervisorAgent", () => {
	let supervisor: OSSupervisorAgent;

	beforeEach(() => {
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		registry.register(
			createMockAgent("andino-main", "Andino", VerticalType.ANDINO, [
				"drone:telemetry",
			]),
		);
		registry.register(
			createMockAgent("drenyra-main", "Drenyra", VerticalType.DRENYRA, [
				"fiscal:invoice",
			]),
		);

		detector.registerVerticalRules(VerticalType.ANDINO, [
			{
				pattern: /\b(drone|vuelo|cultivo|crop)\b/i,
				action: "telemetry",
				priority: 50,
			},
		]);

		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{
				pattern: /\b(invoice|factura|igv|sunat)\b/i,
				action: "fiscal",
				priority: 50,
			},
		]);

		supervisor = new OSSupervisorAgent(registry, detector);
	});

	it("should route drone intent to Andino agent", async () => {
		const result = await supervisor.handleInput(
			"check drone flight status",
			baseContext,
		);
		expect(result.success).toBe(true);
		expect(result.agentId).toBe("andino-main");
		expect(result.data).toHaveProperty("message");
	});

	it("should fallback to Drenyra for unknown intents", async () => {
		const result = await supervisor.handleInput(
			"what is the weather?",
			baseContext,
		);
		expect(result.success).toBe(true);
		expect(result.vertical).toBe(VerticalType.DRENYRA);
	});

	it("should return error for empty input", async () => {
		const result = await supervisor.handleInput("", baseContext);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
	});

	it("should pass through auto level agents without blocking", async () => {
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		const autoAgent: OSAgentPort<unknown, { message: string }> = {
			id: "auto-agent",
			name: "Auto Agent",
			description: "Test agent with auto approval",
			vertical: VerticalType.DRENYRA,
			capabilities: ["test:auto"],
			approvalLevel: "auto",
			execute: async () => ({
				success: true,
				data: { message: "auto approved" },
				metrics: { duration: 0, tokensUsed: 0, cost: 0 },
				agentId: "auto-agent",
			}),
		};

		registry.register(autoAgent);

		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{ pattern: /\bauto-agent-test\b/i, action: "test", priority: 100 },
		]);

		const gate = {
			evaluate: async () => ({ allowed: true, requiresAction: false }),
			approve: async () => undefined,
			reject: async () => undefined,
			getPending: async () => [],
			getRejected: async () => [],
		} as unknown as OSApprovalGateEngine;

		const supervisorWithGate = new OSSupervisorAgent(registry, detector, {
			approvalGate: gate,
		});

		const result = await supervisorWithGate.handleInput(
			"run auto-agent-test",
			baseContext,
		);

		expect(result.success).toBe(true);
		expect(result.agentId).toBe("auto-agent");
		expect(result.data).toEqual({ message: "auto approved" });
	});

	it("should block execution when gate rejects with gate level", async () => {
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
			{ pattern: /\bgate-agent-test\b/i, action: "test", priority: 100 },
		]);

		const gate = {
			evaluate: async () => ({
				allowed: false,
				requiresAction: true,
				requestId: "apr_test_blocked",
				reason: "Gate blocked this action",
			}),
			approve: async () => undefined,
			reject: async () => undefined,
			getPending: async () => [],
			getRejected: async () => [],
		} as unknown as OSApprovalGateEngine;

		const supervisorWithGate = new OSSupervisorAgent(registry, detector, {
			approvalGate: gate,
		});

		const result = await supervisorWithGate.handleInput(
			"run gate-agent-test",
			baseContext,
		);

		expect(result.success).toBe(false);
		expect(result.errors?.[0]).toContain("Gate blocked this action");
		expect(result.requestId).toBe("apr_test_blocked");
	});

	it("should record a trace run when gate rejects", async () => {
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();
		const runStore = new InMemoryAgentRunStore();

		const gateAgent: OSAgentPort<unknown, { message: string }> = {
			id: "gate-agent-2",
			name: "Gate Agent 2",
			description: "Agent for rejected run recording",
			vertical: VerticalType.DRENYRA,
			capabilities: ["test:gate-reject"],
			approvalLevel: "gate",
			execute: async () => ({
				success: true,
				data: { message: "should not reach here" },
				metrics: { duration: 0, tokensUsed: 0, cost: 0 },
				agentId: "gate-agent-2",
			}),
		};

		registry.register(gateAgent);

		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{
				pattern: /\bgate-reject-record\b/i,
				action: "test",
				priority: 100,
			},
		]);

		const gate = {
			evaluate: async () => ({
				allowed: false,
				requiresAction: true,
				requestId: "apr_reject_trace",
				reason: "Policy requires approval",
			}),
			approve: async () => undefined,
			reject: async () => undefined,
			getPending: async () => [],
			getRejected: async () => [],
		} as unknown as OSApprovalGateEngine;

		const supervisor = new OSSupervisorAgent(registry, detector, {
			approvalGate: gate,
			runStore,
		});

		const before = Date.now();
		await supervisor.handleInput("gate-reject-record", baseContext);

		const runs = runStore.list("drenyra");
		expect(runs).toHaveLength(1);
		expect(runs[0]).toBeDefined();
		const run = runs[0];
		expect(run?.approvalStatus).toBe("rejected");
		expect(run?.id).toBeTruthy();
		expect(typeof run?.id).toBe("string");
		expect(run?.vertical).toBe("drenyra");
		expect(run?.prompt).toBe("gate-reject-record");
		expect(run?.userId).toBe("u1");
		expect(run?.response).toContain("Policy requires approval");
		expect(run?.tokensUsed).toBe(0);
		expect(run?.timestamp).toBeInstanceOf(Date);
		expect(run?.timestamp.getTime()).toBeGreaterThanOrEqual(before - 1000);
	});

	it("should work without approval gate (backward compatible)", async () => {
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

		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{
				pattern: /\b(invoice|factura|igv|sunat)\b/i,
				action: "fiscal",
				priority: 50,
			},
		]);

		const supervisorNoGate = new OSSupervisorAgent(registry, detector);

		const result = await supervisorNoGate.handleInput(
			"check drone status",
			baseContext,
		);

		expect(result.success).toBe(true);
		expect(result.agentId).toBe("andino-main");
	});

	it("should record a run in the run store when provided", async () => {
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		const runStore = new InMemoryAgentRunStore();

		const testAgent: OSAgentPort<unknown, { ok: boolean }> = {
			id: "test-agent",
			name: "Test Agent",
			description: "Agent for run recording test",
			vertical: VerticalType.DRENYRA,
			capabilities: ["test:run"],
			approvalLevel: "auto",
			execute: async () => ({
				success: true,
				data: { ok: true },
				metrics: { duration: 5, tokensUsed: 42, cost: 0 },
				agentId: "test-agent",
			}),
		};

		registry.register(testAgent);

		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{ pattern: /\btest-run-record\b/i, action: "test", priority: 100 },
		]);

		const before = Date.now();
		const supervisor = new OSSupervisorAgent(registry, detector, {
			approvalGate: new OSApprovalGateEngine(new InMemoryApprovalStore()),
			runStore,
		});

		await supervisor.handleInput("test-run-record", baseContext);

		const runs = runStore.list("drenyra");
		expect(runs).toHaveLength(1);
		expect(runs[0]).toBeDefined();
		const run = runs[0];
		expect(run?.vertical).toBe("drenyra");
		expect(run?.prompt).toBe("test-run-record");
		expect(run?.approvalStatus).toBe("auto");
		expect(run?.id).toBeTruthy();
		expect(typeof run?.id).toBe("string");
		expect(run?.userId).toBe("u1");
		expect(run?.timestamp).toBeInstanceOf(Date);
		expect(run?.timestamp.getTime()).toBeGreaterThanOrEqual(before - 1000);
		expect(run?.tokensUsed).toBe(42);
	});

	it("should not record a run when no runStore configured", async () => {
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		const testAgent: OSAgentPort<unknown, { ok: boolean }> = {
			id: "no-record-agent",
			name: "No Record Agent",
			description: "Agent for no-record test",
			vertical: VerticalType.DRENYRA,
			capabilities: ["test:no-record"],
			approvalLevel: "auto",
			execute: async () => ({
				success: true,
				data: { ok: true },
				metrics: { duration: 3, tokensUsed: 10, cost: 0 },
				agentId: "no-record-agent",
			}),
		};

		registry.register(testAgent);

		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{
				pattern: /\bno-record-test\b/i,
				action: "test",
				priority: 100,
			},
		]);

		const supervisor = new OSSupervisorAgent(registry, detector);
		const result = await supervisor.handleInput("no-record-test", baseContext);

		expect(result.success).toBe(true);
	});
});
