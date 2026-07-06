import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultPhaseGraph } from "../../../../drenyra-orchestrator/src/phase/fiscal-phase-graph";
import { FiscalPhaseOrchestrator } from "../../../../drenyra-orchestrator/src/phase/fiscal-phase-orchestrator";
import { InMemoryFiscalPhaseStore } from "../../../../drenyra-orchestrator/src/phase/fiscal-phase-store";
import { PhaseGateEngine } from "../../../../drenyra-orchestrator/src/phase/phase-gate-engine";
import { Mnevori } from "../mnevori";

function createTestOrchestrator(store: InMemoryFiscalPhaseStore) {
	const gateEngine = new PhaseGateEngine();

	gateEngine.registerGate({
		id: "periodo-open",
		name: "Periodo Open",
		description: "Allows period to open",
		phaseId: "captura",
		position: "entry",
		evaluate: async () => ({
			gateId: "periodo-open",
			gateName: "Periodo Open",
			passed: true,
			severity: "info" as const,
			evaluatedAt: new Date(),
		}),
	});

	gateEngine.registerGate({
		id: "captura-complete",
		name: "Captura Complete",
		description: "All docs captured",
		phaseId: "captura",
		position: "exit",
		evaluate: async () => ({
			gateId: "captura-complete",
			gateName: "Captura Complete",
			passed: true,
			severity: "info" as const,
			evaluatedAt: new Date(),
		}),
	});

	return new FiscalPhaseOrchestrator({
		store,
		gateEngine,
		graph: createDefaultPhaseGraph(),
	});
}

describe("Mnevori", () => {
	let store: InMemoryFiscalPhaseStore;
	let mnevori: Mnevori;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		mnevori = new Mnevori(store);
	});

	it("should persist an artifact with id and timestamp", async () => {
		await store.upsertPeriodState({
			ruc: "20123456789",
			periodo: "2026-06",
			currentPhase: "captura",
			status: "in_progress",
			phaseHistory: [],
			metadata: {},
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const id = await mnevori.persistArtifact({
			ruc: "20123456789",
			periodo: "2026-06",
			phaseId: "captura",
			type: "agent_output",
			payload: { cpes: 42 },
			version: 1,
			tier: "T2_STRONG",
		});

		expect(id).toMatch(/^mnevori:20123456789:2026-06:captura:/);
	});

	it("should persist a phase snapshot with gate results", async () => {
		const orchestrator = createTestOrchestrator(store);
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");

		await mnevori.persistPhaseSnapshot("20123456789", "2026-06", "captura", {
			status: "completed",
			agentOutput: { cpes: 42 },
			gateResults: [],
		});

		const snapshots = await mnevori.listPhaseSnapshots(
			"20123456789",
			"2026-06",
		);
		expect(snapshots).toHaveLength(1);
		expect(snapshots[0].phaseId).toBe("captura");
	});

	it("should return a resume point after completing a phase", async () => {
		const orchestrator = createTestOrchestrator(store);
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");
		await orchestrator.completePhase("20123456789", "2026-06", "captura", {
			cpes: 42,
		});

		const point = await mnevori.getResumePoint("20123456789", "2026-06");
		expect(point).not.toBeNull();
		expect(point!.lastPhaseId).toBe("captura");
		expect(point!.lastStatus).toBe("completed");
	});
});
