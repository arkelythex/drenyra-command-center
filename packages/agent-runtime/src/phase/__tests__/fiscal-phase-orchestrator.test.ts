import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultPhaseGraph } from "../fiscal-phase-graph";
import { FiscalPhaseOrchestrator } from "../fiscal-phase-orchestrator";
import { InMemoryFiscalPhaseStore } from "../fiscal-phase-store";
import { PhaseGateEngine } from "../phase-gate-engine";

describe("FiscalPhaseOrchestrator", () => {
	let orchestrator: FiscalPhaseOrchestrator;
	let store: InMemoryFiscalPhaseStore;
	let gateEngine: PhaseGateEngine;
	let publishedEvents: Array<{ type: string; payload: unknown }>;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		gateEngine = new PhaseGateEngine();
		publishedEvents = [];

		// Register default gates used by the graph
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
			eventBus: {
				publish: async (type, payload) => {
					publishedEvents.push({ type, payload });
				},
			},
		});
	});

	describe("startPeriod", () => {
		it("creates a new period with captura as initial phase", async () => {
			const result = await orchestrator.startPeriod("20123456789", "2026-06");

			expect(result.success).toBe(true);
			expect(result.phaseId).toBe("captura");
			expect(result.status).toBe("not_started");

			const state = await store.getPeriodState("20123456789", "2026-06");
			expect(state).toBeDefined();
			expect(state?.currentPhase).toBe("captura");
			expect(state?.status).toBe("not_started");
		});

		it("fails if period already exists", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");
			const result = await orchestrator.startPeriod("20123456789", "2026-06");

			expect(result.success).toBe(false);
			expect(result.error).toContain("already exists");
		});

		it("publishes a period.started event", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");

			expect(publishedEvents.length).toBeGreaterThanOrEqual(1);
			expect(publishedEvents[0].type).toBe("phase.period.started");
		});
	});

	describe("startPhase", () => {
		it("starts the captura phase after starting a period", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");
			const result = await orchestrator.startPhase(
				"20123456789",
				"2026-06",
				"captura",
			);

			expect(result.success).toBe(true);
			expect(result.phaseId).toBe("captura");
			expect(result.status).toBe("in_progress");
		});

		it("rejects invalid transitions (skipping phases)", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");
			// Try to start clasificacion directly from captura (without completing captura first)
			// Actually, startPhase for clasificacion while currentPhase is captura should work as long as it's a valid forward transition
			// Let's try a bigger skip
			const result = await orchestrator.startPhase(
				"20123456789",
				"2026-06",
				"conciliacion",
			);
			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid transition");
		});

		it("fails if period does not exist", async () => {
			const result = await orchestrator.startPhase("999", "2026-01", "captura");
			expect(result.success).toBe(false);
			expect(result.error).toContain("not found");
		});

		it("blocks phase when entry gates fail", async () => {
			// Override gate to fail
			gateEngine.registerGate({
				id: "periodo-open",
				name: "Periodo Open",
				description: "Blocking gate",
				phaseId: "captura",
				position: "entry",
				evaluate: async () => ({
					gateId: "periodo-open",
					gateName: "Periodo Open",
					passed: false,
					severity: "error",
					reason: "Periodo already closed",
					evaluatedAt: new Date(),
				}),
			});

			await orchestrator.startPeriod("20123456789", "2026-06");
			const result = await orchestrator.startPhase(
				"20123456789",
				"2026-06",
				"captura",
			);

			expect(result.success).toBe(false);
			expect(result.status).toBe("blocked");
			expect(result.error).toContain("Periodo already closed");
		});
	});

	describe("completePhase", () => {
		it("completes a phase and advances the period state", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");
			await orchestrator.startPhase("20123456789", "2026-06", "captura");

			const result = await orchestrator.completePhase(
				"20123456789",
				"2026-06",
				"captura",
				{ docs: 42 },
			);

			expect(result.success).toBe(true);
			expect(result.phaseId).toBe("captura");

			const state = await store.getPeriodState("20123456789", "2026-06");
			expect(state?.status).toBe("completed");
			const capturaEntry = state?.phaseHistory.find(
				(e) => e.phaseId === "captura",
			);
			expect(capturaEntry?.status).toBe("completed");
			expect(capturaEntry?.agentOutput).toEqual({ docs: 42 });
		});

		it("blocks phase completion when exit gates fail", async () => {
			gateEngine.registerGate({
				id: "captura-complete",
				name: "Captura Complete",
				description: "Blocking exit gate",
				phaseId: "captura",
				position: "exit",
				evaluate: async () => ({
					gateId: "captura-complete",
					gateName: "Captura Complete",
					passed: false,
					severity: "error",
					reason: "3 comprobantes pendientes de clasificar",
					evaluatedAt: new Date(),
				}),
			});

			await orchestrator.startPeriod("20123456789", "2026-06");
			await orchestrator.startPhase("20123456789", "2026-06", "captura");

			const result = await orchestrator.completePhase(
				"20123456789",
				"2026-06",
				"captura",
				{ docs: 10 },
			);

			expect(result.success).toBe(false);
			expect(result.gateResult.blockers).toHaveLength(1);
			expect(result.error).toContain("pendientes");
		});

		it("auto-advances to next phase when option is set and gates pass", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");
			await orchestrator.startPhase("20123456789", "2026-06", "captura");

			// Register the clasificacion entry gate
			gateEngine.registerGate({
				id: "captura-done",
				name: "Captura Done",
				description: "All docs classified",
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

			await orchestrator.completePhase(
				"20123456789",
				"2026-06",
				"captura",
				{ docs: 42 },
				{ autoAdvance: true },
			);

			const state = await store.getPeriodState("20123456789", "2026-06");
			expect(state?.currentPhase).toBe("clasificacion");
			expect(state?.status).toBe("in_progress");
		});
	});

	describe("failPhase", () => {
		it("marks a phase as failed with error", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");
			await orchestrator.startPhase("20123456789", "2026-06", "captura");

			const result = await orchestrator.failPhase(
				"20123456789",
				"2026-06",
				"captura",
				"SUNAT SOL connection timeout",
			);

			expect(result.success).toBe(false);
			expect(result.status).toBe("failed");

			const state = await store.getPeriodState("20123456789", "2026-06");
			expect(state?.status).toBe("failed");
			const entry = state?.phaseHistory.find((e) => e.phaseId === "captura");
			expect(entry?.error).toContain("SUNAT SOL");
		});
	});

	describe("forceAdvance", () => {
		it("force-advances to a specific phase bypassing gates", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");

			const result = await orchestrator.forceAdvance(
				"20123456789",
				"2026-06",
				"declaracion",
			);

			expect(result.success).toBe(true);
			expect(result.phaseId).toBe("declaracion");

			const state = await store.getPeriodState("20123456789", "2026-06");
			expect(state?.currentPhase).toBe("declaracion");
			expect(state?.status).toBe("in_progress");
		});

		it("fails for unknown phase IDs", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");
			const result = await orchestrator.forceAdvance(
				"20123456789",
				"2026-06",
				"nonexistent" as never,
			);
			expect(result.success).toBe(false);
		});
	});

	describe("query methods", () => {
		it("getPeriodStatus returns period state", async () => {
			await orchestrator.startPeriod("20123456789", "2026-06");

			const state = await orchestrator.getPeriodStatus(
				"20123456789",
				"2026-06",
			);
			expect(state).toBeDefined();
			expect(state?.ruc).toBe("20123456789");
		});

		it("getActivePeriods lists in-progress periods", async () => {
			await orchestrator.startPeriod("A", "2026-01");
			await orchestrator.startPeriod("B", "2026-01");

			const active = await orchestrator.getActivePeriods();
			expect(active).toHaveLength(2); // not_started counts as active
		});

		it("canTransition checks valid phase transitions", () => {
			expect(orchestrator.canTransition("captura", "clasificacion")).toBe(true);
			expect(orchestrator.canTransition("captura", "auditoria")).toBe(false);
		});
	});

	describe("full cycle integration", () => {
		it("runs a complete captura→clasificacion flow", async () => {
			// Register all needed gates
			const gateIds = [
				"periodo-open",
				"captura-complete",
				"captura-done",
				"clasificacion-complete",
			];

			for (const gid of gateIds) {
				if (!gateEngine.getGate(gid)) {
					gateEngine.registerGate({
						id: gid,
						name: gid,
						description: "Auto gate",
						phaseId: gid.includes("captura")
							? "captura"
							: gid.includes("clasificacion")
								? "clasificacion"
								: "captura",
						position:
							gid.endsWith("-complete") || gid.endsWith("-done")
								? "exit"
								: "entry",
						evaluate: async () => ({
							gateId: gid,
							gateName: gid,
							passed: true,
							severity: "info" as const,
							evaluatedAt: new Date(),
						}),
					});
				}
			}

			// Period → Captura → Clasificación
			let result = await orchestrator.startPeriod("RUC123", "2026-07");
			expect(result.success).toBe(true);

			result = await orchestrator.startPhase("RUC123", "2026-07", "captura");
			expect(result.success).toBe(true);
			expect(result.status).toBe("in_progress");

			const execResult = await orchestrator.completePhase(
				"RUC123",
				"2026-07",
				"captura",
				{ totalDocs: 50 },
				{ autoAdvance: true },
			);
			expect(execResult.success).toBe(true);

			const state = await store.getPeriodState("RUC123", "2026-07");
			expect(state?.currentPhase).toBe("clasificacion");
		});
	});
});
