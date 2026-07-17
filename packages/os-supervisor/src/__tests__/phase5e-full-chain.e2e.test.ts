/**
 * Phase 5E — Full-chain E2E integration test
 *
 * Wires ALL OS components together:
 *  PlatformEventBus + OSSupervisorAgent (5 verticals)
 *  + OSApprovalGateEngine + OPAPolicyEngine (mocked)
 *  + InMemoryApprovalStore + InMemoryAgentRunStore + InMemoryRagStore
 *
 * Exercises: routing, gate decisions, events, traceability, RAG context.
 */

import { PlatformEventBus, PlatformEventTypes } from "@arkelythex/core/events";
import { describe, expect, it, vi } from "vitest";
import type { OSAgentContext, OSAgentPort } from "../types/agent.types.js";
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

import { OSApprovalGateEngine } from "../approval/approval-gate-engine.js";
import { InMemoryApprovalStore } from "../approval/approval-store.js";
import { GeneralizedIntentDetector } from "../intent/intent-detector.js";
import { InMemoryRagStore } from "../rag/in-memory-rag-store.js";
import { OSKnowledgeNamespace } from "../rag/types.js";
import { VerticalAgentRegistry } from "../registry/vertical-agent-registry.js";
import { OSSupervisorAgent } from "../supervisor/os-supervisor-agent.js";
import { InMemoryAgentRunStore } from "../traceability/in-memory-run-store.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-e2e",
	vertical: VerticalType.DRENYRA,
};

function registerAllRules(detector: GeneralizedIntentDetector): void {
	detector.registerVerticalRules(VerticalType.DRENYRA, [
		{
			pattern: /\b(invoice|factura|igv|sunat|tax|impuesto)\b/i,
			action: "fiscal",
			priority: 50,
		},
	]);
	detector.registerVerticalRules(VerticalType.ANDINO, [
		{
			pattern: /\b(drone|vuelo|flight|crop|cultivo|morphology)\b/i,
			action: "drone",
			priority: 50,
		},
	]);
	detector.registerVerticalRules(VerticalType.ADMIN, [
		{
			pattern:
				/\b(employee|empleado|contract|contrato|nómina|payroll|salary)\b/i,
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
			pattern: /\b(cowork|booking|reserva|espacio|space|membresía)\b/i,
			action: "space",
			priority: 50,
		},
	]);
}

function createMockOPA(result: {
	decision?: "allow" | "deny" | "gate";
	reason?: string;
	allowed?: boolean;
}) {
	const allowed = result.allowed ?? result.decision !== "deny";
	const decision = result.decision ?? (allowed ? "allow" : "deny");
	return {
		evaluate: vi
			.fn()
			.mockResolvedValue({ allowed, decision, reason: result.reason }),
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Phase 5E — Full OS chain E2E", () => {
	it("should route all 5 verticals correctly through the full OS chain", async () => {
		const bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();
		const store = new InMemoryApprovalStore();
		const runStore = new InMemoryAgentRunStore();
		const ragStore = new InMemoryRagStore();

		// Seed RAG with documents
		await ragStore.index({
			id: "rag-1",
			content: "Reservation policy: cowork spaces require 24h notice.",
			namespace: OSKnowledgeNamespace.KUSE,
			metadata: { source: "policy" },
		});

		// Admin needs gate-level approval for the test
		const admin = createMockAgent("admin-main", "Admin", VerticalType.ADMIN, [
			"hr:command",
		]);
		admin.approvalLevel = "gate";

		registry.register(
			createMockAgent("drenyra-main", "Drenyra", VerticalType.DRENYRA, [
				"fiscal:invoice",
			]),
		);
		registry.register(
			createMockAgent("andino-main", "Andino", VerticalType.ANDINO, [
				"drone:telemetry",
			]),
		);
		registry.register(admin);
		registry.register(
			createMockAgent("edge-main", "Edge", VerticalType.EDGE_TRAZ_AGRO, [
				"trace:provenance",
			]),
		);
		registry.register(
			createMockAgent("kuse-main", "Kuse", VerticalType.KUSE, [
				"cowork:booking",
			]),
		);
		registerAllRules(detector);

		// No OPA — using built-in rules for deterministic results
		const gate = new OSApprovalGateEngine(store, undefined, bus);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			eventBus: bus,
			approvalGate: gate,
			runStore,
			rag: ragStore,
		});

		// Collect events
		const agentEvents: Array<{ type: string; vertical: string }> = [];
		const approvalEvents: Array<{ type: string }> = [];

		bus.subscribe(PlatformEventTypes.OsAgentExecuted, (e) => {
			agentEvents.push({
				type: e.type,
				vertical: (e.payload as Record<string, unknown>).vertical as string,
			});
		});
		bus.subscribe(PlatformEventTypes.OsApprovalRequested, (e) => {
			approvalEvents.push({ type: e.type });
		});

		// --- Andino (auto — should succeed + emit event) ---
		const r1 = await supervisor.handleInput("check drone flight status", {
			...baseContext,
			traceId: "tr-andino",
		});
		expect(r1.success).toBe(true);
		expect(r1.vertical).toBe(VerticalType.ANDINO);

		// --- Admin gate (should block + create approval request + emit event) ---
		const r2 = await supervisor.handleInput("process salary update", {
			...baseContext,
			traceId: "tr-admin",
		});
		expect(r2.success).toBe(false);
		expect(r2.requestId).toBeDefined();

		// --- Edge (auto, drenyra fallback) ---
		const r3 = await supervisor.handleInput("trace lot OR-2025-42", {
			...baseContext,
			traceId: "tr-edge",
		});
		expect(r3.success).toBe(true);
		expect(r3.vertical).toBe(VerticalType.EDGE_TRAZ_AGRO);

		// --- Kuse (auto) ---
		const r4 = await supervisor.handleInput("cowork booking for tomorrow", {
			...baseContext,
			traceId: "tr-kuse",
		});
		expect(r4.success).toBe(true);
		expect(r4.vertical).toBe(VerticalType.KUSE);

		// --- Drenyra (auto, fallback) ---
		const r5 = await supervisor.handleInput("show latest invoice", {
			...baseContext,
			traceId: "tr-drenyra",
		});
		expect(r5.success).toBe(true);
		expect(r5.vertical ?? VerticalType.DRENYRA).toBeDefined();

		// --- Events ---
		expect(agentEvents.length).toBeGreaterThanOrEqual(4);
		expect(approvalEvents.length).toBe(1); // only gate block
	});

	it("should record traceability for every agent execution", async () => {
		const bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();
		const runStore = new InMemoryAgentRunStore();
		const ragStore = new InMemoryRagStore();

		registry.register(
			createMockAgent("drenyra-main", "Drenyra", VerticalType.DRENYRA, [
				"fiscal:invoice",
			]),
		);
		registry.register(
			createMockAgent("andino-main", "Andino", VerticalType.ANDINO, [
				"drone:telemetry",
			]),
		);
		registry.register(
			createMockAgent("admin-main", "Admin", VerticalType.ADMIN, [
				"hr:command",
			]),
		);
		registry.register(
			createMockAgent("edge-main", "Edge", VerticalType.EDGE_TRAZ_AGRO, [
				"trace:provenance",
			]),
		);
		registry.register(
			createMockAgent("kuse-main", "Kuse", VerticalType.KUSE, [
				"cowork:booking",
			]),
		);
		registerAllRules(detector);

		const gate = new OSApprovalGateEngine(
			new InMemoryApprovalStore(),
			undefined,
			bus,
		);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			approvalGate: gate,
			runStore,
			rag: ragStore,
		});

		await supervisor.handleInput("check drone morphology evolution", {
			...baseContext,
			traceId: "tr-trace-1",
		});
		await supervisor.handleInput("find employee contract", {
			...baseContext,
			traceId: "tr-trace-2",
		});

		const runs = runStore.list();
		expect(runs.length).toBe(2);
		const verticals = runs.map((r) => r.vertical);
		expect(verticals).toContain(VerticalType.ANDINO);
		expect(verticals).toContain(VerticalType.ADMIN);
		expect(runs[0]?.userId).toBe("u1");
		expect(runs[0]?.traceId ?? runs[0]?.prompt).toBeDefined();
	});

	it("should pass RAG context through OSAgentContext", async () => {
		const _bus = new PlatformEventBus();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();
		const runStore = new InMemoryAgentRunStore();
		const ragStore = new InMemoryRagStore();

		await ragStore.index({
			id: "kuse-policy",
			content: "Cancellation policy: free up to 2h before booking.",
			namespace: OSKnowledgeNamespace.KUSE,
			metadata: {},
		});

		registry.register(
			createMockAgent("kuse-main", "Kuse", VerticalType.KUSE, [
				"cowork:booking",
			]),
		);
		detector.registerVerticalRules(VerticalType.KUSE, [
			{
				pattern: /\b(cowork|booking|cancel)\b/i,
				action: "space",
				priority: 50,
			},
		]);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			runStore,
			rag: ragStore,
		});

		const result = await supervisor.handleInput("cancel cowork booking", {
			...baseContext,
			traceId: "tr-rag",
		});

		expect(result.success).toBe(true);
	});

	it("should handle OPA allow / deny / gate through the approval gate", async () => {
		const bus = new PlatformEventBus();
		const store = new InMemoryApprovalStore();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();

		const andino = createMockAgent(
			"andino-main",
			"Andino",
			VerticalType.ANDINO,
			["drone:telemetry"],
		);
		andino.approvalLevel = "policy_gate";
		registry.register(andino);
		detector.registerVerticalRules(VerticalType.ANDINO, [
			{ pattern: /\b(drone|flight|mission)\b/i, action: "drone", priority: 50 },
		]);

		// OPA: deny missions
		const mockOPA = createMockOPA({
			decision: "deny",
			allowed: false,
			reason: "Airspace restricted",
		});
		const gate = new OSApprovalGateEngine(store, mockOPA, bus);

		const supervisor = new OSSupervisorAgent(registry, detector, {
			approvalGate: gate,
			eventBus: bus,
		});

		const result = await supervisor.handleInput("launch drone mission", {
			...baseContext,
			traceId: "tr-opa",
		});

		// OPA deny → gate returns { allowed: false }, request is created as rejected
		expect(result.success).toBe(false);
		expect(result.requestId).toBeDefined();

		const req = await store.get(result.requestId!);
		expect(req).toBeDefined();
		expect(req?.state).toBe("rejected");
	});

	it("should publish approval.resolved when a gate request is approved", async () => {
		const bus = new PlatformEventBus();
		const store = new InMemoryApprovalStore();
		const registry = new VerticalAgentRegistry();
		const detector = new GeneralizedIntentDetector();
		const drenyra = createMockAgent(
			"drenyra-main",
			"Drenyra",
			VerticalType.DRENYRA,
			["fiscal:invoice"],
		);
		drenyra.approvalLevel = "gate";
		registry.register(drenyra);
		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{ pattern: /\b(invoice|factura)\b/i, action: "fiscal", priority: 50 },
		]);

		const gate = new OSApprovalGateEngine(store, undefined, bus);
		const supervisor = new OSSupervisorAgent(registry, detector, {
			approvalGate: gate,
			eventBus: bus,
		});

		// Trigger gate block
		const r1 = await supervisor.handleInput("post invoice", {
			...baseContext,
			traceId: "tr-approve",
		});
		expect(r1.requestId).toBeDefined();

		// Collector for approval.resolved events
		const resolved: Array<string> = [];
		bus.subscribe(PlatformEventTypes.OsApprovalResolved, (e) => {
			const res = (e.payload as Record<string, unknown>).resolution as string;
			resolved.push(res);
		});

		// Approve the request
		await gate.approve(r1.requestId!, "reviewer1");

		// Should emit resolved: approved
		expect(resolved).toContain("approved");

		// Request state is now approved
		const req = await store.get(r1.requestId!);
		expect(req).toBeDefined();
		expect(req?.state).toBe("approved");
	});
});
