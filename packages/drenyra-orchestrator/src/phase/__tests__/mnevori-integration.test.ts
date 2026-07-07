import { Mnevori } from "@drenyra/agents/mnevori";
import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultPhaseGraph } from "../fiscal-phase-graph";
import { FiscalPhaseOrchestrator } from "../fiscal-phase-orchestrator";
import { InMemoryFiscalPhaseStore } from "../fiscal-phase-store";
import { PhaseGateEngine } from "../phase-gate-engine";

describe("FiscalPhaseOrchestrator + Mnevori integration", () => {
	let store: InMemoryFiscalPhaseStore;
	let mnevori: Mnevori;
	let orchestrator: FiscalPhaseOrchestrator;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		mnevori = new Mnevori(store);

		const gateEngine = new PhaseGateEngine();

		gateEngine.registerGate({
			id: "periodo-open",
			name: "Periodo Open",
			description: "Check if period can be opened",
			phaseId: "captura",
			position: "entry",
			evaluate: async () => ({
				gateId: "periodo-open",
				gateName: "Periodo Open",
				passed: true,
				severity: "info",
				evaluatedAt: new Date(),
			}),
		});

		gateEngine.registerGate({
			id: "captura-complete",
			name: "Captura Complete",
			description: "All documents captured",
			phaseId: "captura",
			position: "exit",
			evaluate: async () => ({
				gateId: "captura-complete",
				gateName: "Captura Complete",
				passed: true,
				severity: "info",
				evaluatedAt: new Date(),
			}),
		});

		gateEngine.registerGate({
			id: "captura-done",
			name: "Captura Done",
			description: "Captura phase completed successfully",
			phaseId: "clasificacion",
			position: "entry",
			evaluate: async () => ({
				gateId: "captura-done",
				gateName: "Captura Done",
				passed: true,
				severity: "info",
				evaluatedAt: new Date(),
			}),
		});

		orchestrator = new FiscalPhaseOrchestrator({
			store,
			gateEngine,
			graph: createDefaultPhaseGraph(),
			mnevori,
		});
	});

	it("should resume period from the last completed phase", async () => {
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");
		await orchestrator.completePhase("20123456789", "2026-06", "captura", {});

		const result = await orchestrator.resumePeriod("20123456789", "2026-06");
		expect(result.success).toBe(true);
		expect(result.phaseId).toBe("clasificacion");
	});

	it("should resume same phase if previous was in_progress", async () => {
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");

		const result = await orchestrator.resumePeriod("20123456789", "2026-06");
		expect(result.success).toBe(true);
		expect(result.phaseId).toBe("captura");
	});

	it("should persist Mnevori snapshot when completing a phase", async () => {
		await orchestrator.startPeriod("20123456789", "2026-06");
		await orchestrator.startPhase("20123456789", "2026-06", "captura");
		const result = await orchestrator.completePhase(
			"20123456789",
			"2026-06",
			"captura",
			{
				cpesCapturados: 42,
			},
		);

		expect(result.success).toBe(true);

		const snapshots = await mnevori.listPhaseSnapshots(
			"20123456789",
			"2026-06",
		);
		expect(snapshots).toHaveLength(1);
		expect(snapshots[0].phaseId).toBe("captura");
	});
});
