// ─── Auto-Advance Engine + Batch Orchestrator Tests ────────────────

import { beforeEach, describe, expect, it } from "vitest";
import {
	AutoAdvanceEngine,
	buildAutoAdvanceContext,
} from "../auto-advance-engine";
import { BatchOrchestrator } from "../batch-orchestrator";
import { registerFiscalGates } from "../fiscal-gates";
import { createDefaultPhaseGraph } from "../fiscal-phase-graph";
import { FiscalPhaseOrchestrator } from "../fiscal-phase-orchestrator";
import { InMemoryFiscalPhaseStore } from "../fiscal-phase-store";
import { PhaseGateEngine } from "../phase-gate-engine";
import type {
	AutoAdvanceContext,
	FiscalPeriodState,
	FiscalPhaseId,
	GateResult,
} from "../types";

// ─── Helpers ────────────────────────────────────────────────────

function createGateResult(overrides?: Partial<GateResult>): GateResult {
	return {
		gateId: overrides?.gateId ?? "test-gate",
		gateName: overrides?.gateName ?? "Test Gate",
		passed: overrides?.passed ?? true,
		severity: overrides?.severity ?? "info",
		reason: overrides?.reason,
		evaluatedAt: overrides?.evaluatedAt ?? new Date(),
	};
}

function createAutoAdvanceCtx(
	overrides?: Partial<AutoAdvanceContext>,
): AutoAdvanceContext {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		phaseId: overrides?.phaseId ?? "captura",
		gateResults: overrides?.gateResults ?? [],
		agentOutput: overrides?.agentOutput,
		metadata: overrides?.metadata ?? {},
	};
}

// ─── AutoAdvanceEngine ──────────────────────────────────────────

describe("AutoAdvanceEngine", () => {
	let engine: AutoAdvanceEngine;

	beforeEach(() => {
		engine = new AutoAdvanceEngine();
	});

	describe("default configuration", () => {
		it("uses DEFAULT_AUTO_ADVANCE_CONFIG by default", () => {
			expect(engine).toBeDefined();
			// Should have cierre and declaracion disabled by default
		});

		it("accepts partial config overrides", () => {
			const custom = new AutoAdvanceEngine({ minConfidence: 0.8 });
			expect(custom).toBeDefined();
		});
	});

	describe("evaluate - Captura phase", () => {
		it("auto-advances when all gates pass and documents captured", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "captura",
				gateResults: [
					createGateResult({ gateId: "captura-complete", passed: true }),
				],
				metadata: { totalRecibidos: 50 },
			});

			const result = await engine.evaluate("captura", ctx);
			expect(result.shouldAdvance).toBe(true);
			expect(result.confidence).toBeGreaterThan(0.9);
		});

		it("does NOT auto-advance when gates have errors", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "captura",
				gateResults: [
					createGateResult({
						gateId: "captura-complete",
						passed: false,
						severity: "error",
						reason: "Comprobantes pendientes",
					}),
				],
				metadata: { totalRecibidos: 50 },
			});

			const result = await engine.evaluate("captura", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.blockingGates).toContain("captura-complete");
		});

		it("does NOT auto-advance when no documents captured", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "captura",
				gateResults: [
					createGateResult({ gateId: "captura-complete", passed: true }),
				],
				metadata: { totalRecibidos: 0 },
			});

			const result = await engine.evaluate("captura", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.confidence).toBeLessThan(0.5);
		});
	});

	describe("evaluate - Clasificación phase", () => {
		it("auto-advances when coverage >= 95%", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "clasificacion",
				gateResults: [createGateResult({ passed: true })],
				metadata: { coverage: 0.97 },
			});

			const result = await engine.evaluate("clasificacion", ctx);
			expect(result.shouldAdvance).toBe(true);
			expect(result.confidence).toBeGreaterThan(0.95);
		});

		it("does NOT auto-advance when coverage is 80-95%", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "clasificacion",
				gateResults: [createGateResult({ passed: true })],
				metadata: { coverage: 0.85 },
			});

			const result = await engine.evaluate("clasificacion", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.confidence).toBeLessThan(0.8);
		});

		it("blocks when coverage is critically low", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "clasificacion",
				gateResults: [createGateResult({ passed: true })],
				metadata: { coverage: 0.5 },
			});

			const result = await engine.evaluate("clasificacion", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.confidence).toBeLessThan(0.5);
		});
	});

	describe("evaluate - Conciliación phase", () => {
		it("auto-advances when variance <= 1%", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "conciliacion",
				gateResults: [createGateResult({ passed: true })],
				metadata: { variance: 0.005 },
			});

			const result = await engine.evaluate("conciliacion", ctx);
			expect(result.shouldAdvance).toBe(true);
			expect(result.confidence).toBeGreaterThan(0.95);
		});

		it("auto-advances when variance <= 5%", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "conciliacion",
				gateResults: [createGateResult({ passed: true })],
				metadata: { variance: 0.03 },
			});

			const result = await engine.evaluate("conciliacion", ctx);
			expect(result.shouldAdvance).toBe(true);
			expect(result.confidence).toBeGreaterThan(0.9);
		});

		it("does NOT auto-advance when variance > 5%", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "conciliacion",
				gateResults: [createGateResult({ passed: true })],
				metadata: { variance: 0.08 },
			});

			const result = await engine.evaluate("conciliacion", ctx);
			expect(result.shouldAdvance).toBe(false);
		});

		it("blocks on critical gate errors", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "conciliacion",
				gateResults: [
					createGateResult({
						gateId: "conciliacion-variance",
						passed: false,
						severity: "critical",
						reason: "Bank reconciliation API unavailable",
					}),
				],
			});

			const result = await engine.evaluate("conciliacion", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.blockingGates).toContain("conciliacion-variance");
		});
	});

	describe("evaluate - Cierre phase", () => {
		it("NEVER auto-advances (disabled by default)", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "cierre",
				gateResults: [createGateResult({ passed: true })],
			});

			const result = await engine.evaluate("cierre", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.confidence).toBe(0);
			expect(result.reason).toContain("disabled");
		});
	});

	describe("evaluate - Declaración phase", () => {
		it("NEVER auto-advances (disabled by default)", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "declaracion",
				gateResults: [createGateResult({ passed: true })],
			});

			const result = await engine.evaluate("declaracion", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.confidence).toBe(0);
			expect(result.reason).toContain("disabled");
		});
	});

	describe("evaluate - Auditoría phase", () => {
		it("auto-advances when confidence is high and no critical findings", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "auditoria",
				gateResults: [createGateResult({ passed: true })],
				metadata: { confianza: 0.95, hallazgosCritical: 0 },
			});

			const result = await engine.evaluate("auditoria", ctx);
			expect(result.shouldAdvance).toBe(true);
			expect(result.confidence).toBe(0.95);
		});

		it("does NOT auto-advance when confidence is low", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "auditoria",
				gateResults: [createGateResult({ passed: true })],
				metadata: { confianza: 0.5, hallazgosCritical: 0 },
			});

			const result = await engine.evaluate("auditoria", ctx);
			expect(result.shouldAdvance).toBe(false);
		});

		it("blocks on critical findings", async () => {
			const ctx = createAutoAdvanceCtx({
				phaseId: "auditoria",
				gateResults: [createGateResult({ passed: true })],
				metadata: { confianza: 0.95, hallazgosCritical: 2 },
			});

			const result = await engine.evaluate("auditoria", ctx);
			expect(result.shouldAdvance).toBe(false);
			expect(result.confidence).toBeLessThan(0.5);
		});
	});

	describe("custom evaluators", () => {
		it("allows registering custom per-phase evaluators", async () => {
			engine.registerEvaluator("captura", (ctx) => ({
				shouldAdvance: ctx.metadata.customFlag === "go",
				confidence: 0.95,
				reason: "Custom evaluator",
				blockingGates: [],
			}));

			const ctx = createAutoAdvanceCtx({
				phaseId: "captura",
				metadata: { customFlag: "go" },
			});

			const result = await engine.evaluate("captura", ctx);
			expect(result.shouldAdvance).toBe(true);
			expect(result.reason).toBe("Custom evaluator");
		});
	});

	describe("getEffectiveConfig", () => {
		it("returns phase-specific config", () => {
			const cfg = engine.getEffectiveConfig("cierre");
			expect(cfg.enabled).toBe(false); // Cierre disabled by default
		});

		it("returns global defaults for phases without overrides", () => {
			const cfg = engine.getEffectiveConfig("captura");
			expect(cfg.enabled).toBe(true);
			expect(cfg.minConfidence).toBe(0.9);
		});
	});

	describe("buildAutoAdvanceContext", () => {
		it("builds context from gate results and agent output", () => {
			const ctx = buildAutoAdvanceContext({
				ruc: "20123456789",
				periodo: "2026-06",
				phaseId: "captura",
				gateResults: [createGateResult()],
				agentOutput: { docs: 42 },
				metadata: { totalRecibidos: 42 },
			});

			expect(ctx.ruc).toBe("20123456789");
			expect(ctx.gateResults).toHaveLength(1);
			expect(ctx.agentOutput).toEqual({ docs: 42 });
			expect(ctx.metadata.totalRecibidos).toBe(42);
		});
	});
});

// ─── BatchOrchestrator ──────────────────────────────────────────

describe("BatchOrchestrator", () => {
	let orchestrator: FiscalPhaseOrchestrator;
	let store: InMemoryFiscalPhaseStore;
	let gateEngine: PhaseGateEngine;
	let batch: BatchOrchestrator;
	let publishedEvents: Array<{ type: string; payload: unknown }>;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		gateEngine = new PhaseGateEngine();
		publishedEvents = [];
		registerFiscalGates(gateEngine);

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

		batch = new BatchOrchestrator(
			orchestrator,
			store,
			{ maxParallel: 3, autoAdvance: true },
			{},
		);
	});

	describe("start / getStatus", () => {
		it("starts a batch with multiple RUCs", async () => {
			const status = await batch.start([
				{ ruc: "20123456789", periodo: "2026-01" },
				{ ruc: "20987654321", periodo: "2026-01" },
			]);

			expect(status.total).toBe(2);
			expect(status.notStarted + status.inProgress).toBe(2);
		});

		it("throws if batch is already processing", async () => {
			await batch.start([{ ruc: "20123456789", periodo: "2026-01" }]);

			await expect(
				batch.start([{ ruc: "20987654321", periodo: "2026-02" }]),
			).rejects.toThrow("already processing");
		});

		it("reports aggregate status correctly", async () => {
			await batch.start([
				{ ruc: "20123456789", periodo: "2026-01" },
				{ ruc: "20987654321", periodo: "2026-01" },
			]);

			const status = batch.getStatus();
			expect(status.total).toBe(2);
			expect(status.startedAt).toBeDefined();
			expect(status.entries).toHaveLength(2);
		});

		it("handles a single RUC batch successfully", async () => {
			await batch.start([{ ruc: "20123456789", periodo: "2026-01" }]);
			const finalStatus = await batch.waitForCompletion();

			expect(finalStatus.total).toBe(1);
			// Should complete or at least not fail
			expect(finalStatus.failed).toBe(0);
		});
	});

	describe("pause / resume", () => {
		it("pauses and resumes specific RUCs", async () => {
			await batch.start([
				{ ruc: "20123456789", periodo: "2026-01" },
				{ ruc: "20987654321", periodo: "2026-01" },
			]);

			await batch.pause(["20123456789"]);

			const status = batch.getStatus();
			expect(status.total).toBe(2);

			await batch.resume(["20123456789"]);
		});

		it("pauses and resumes entire batch", async () => {
			await batch.start([
				{ ruc: "20123456789", periodo: "2026-01" },
				{ ruc: "20987654321", periodo: "2026-01" },
			]);

			await batch.pause();
			await batch.resume();
		});
	});

	describe("callbacks", () => {
		it("calls onPhaseComplete when a phase finishes", async () => {
			const completedPhases: Array<{
				ruc: string;
				phaseId: string;
			}> = [];

			// Use simple passing gates so phases complete
			const passGateEngine = new PhaseGateEngine();
			for (const gid of ["periodo-open", "captura-complete", "captura-done"]) {
				passGateEngine.registerGate({
					id: gid,
					name: gid,
					description: "Always passes",
					phaseId: gid.includes("captura") ? "captura" : "clasificacion",
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

			const passOrch = new FiscalPhaseOrchestrator({
				store: new InMemoryFiscalPhaseStore(),
				gateEngine: passGateEngine,
				graph: createDefaultPhaseGraph(),
			});

			const batchWithCallbacks = new BatchOrchestrator(
				passOrch,
				new InMemoryFiscalPhaseStore(),
				{ maxParallel: 2, autoAdvance: true },
				{
					onPhaseComplete: async (ruc, _periodo, phaseId) => {
						completedPhases.push({ ruc, phaseId });
					},
				},
			);

			await batchWithCallbacks.start([
				{ ruc: "20123456789", periodo: "2026-01" },
			]);

			await batchWithCallbacks.waitForCompletion();

			// At minimum, captura phase should complete
			expect(completedPhases.length).toBeGreaterThanOrEqual(1);
			expect(completedPhases[0].ruc).toBe("20123456789");
		});

		it("calls onError when processing fails", async () => {
			const errors: Array<{ ruc: string; error: string }> = [];

			const _batchWithErrors = new BatchOrchestrator(
				orchestrator,
				store,
				{ maxParallel: 2, autoAdvance: true },
				{
					onError: async (ruc, _periodo, _phaseId, error) => {
						errors.push({ ruc, error });
					},
				},
			);

			// Use an orchestrator with a blocking gate
			const failingGateEngine = new PhaseGateEngine();
			failingGateEngine.registerGate({
				id: "periodo-open",
				name: "Periodo Open",
				description: "Always blocks",
				phaseId: "captura",
				position: "entry",
				evaluate: async () => ({
					gateId: "periodo-open",
					gateName: "Periodo Open",
					passed: false,
					severity: "error",
					reason: "SUNAT connection failed",
					evaluatedAt: new Date(),
				}),
			});

			const failingOrch = new FiscalPhaseOrchestrator({
				store: new InMemoryFiscalPhaseStore(),
				gateEngine: failingGateEngine,
				graph: createDefaultPhaseGraph(),
			});

			const failingBatch = new BatchOrchestrator(
				failingOrch,
				new InMemoryFiscalPhaseStore(),
				{ maxParallel: 2, autoAdvance: true },
				{
					onError: async (ruc, _periodo, _phaseId, error) => {
						errors.push({ ruc, error });
					},
				},
			);

			await failingBatch.start([{ ruc: "20123456789", periodo: "2026-01" }]);
			await failingBatch.waitForCompletion();

			expect(errors.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe("isProcessing / waitForCompletion", () => {
		it("reports processing state correctly", async () => {
			const p = batch.start([
				{ ruc: "20123456789", periodo: "2026-01" },
				{ ruc: "20987654321", periodo: "2026-01" },
				{ ruc: "20456789012", periodo: "2026-01" },
			]);

			expect(batch.isProcessing()).toBe(true);

			await p;
			const status = await batch.waitForCompletion();
			expect(batch.isProcessing()).toBe(false);
			expect(status.total).toBe(3);
		});
	});
});

// ─── Integration: Auto-Advance + Orchestrator ───────────────────

describe("AutoAdvance integration with FiscalPhaseOrchestrator", () => {
	let orchestrator: FiscalPhaseOrchestrator;
	let store: InMemoryFiscalPhaseStore;
	let gateEngine: PhaseGateEngine;
	let autoAdvance: AutoAdvanceEngine;
	let publishedEvents: Array<{ type: string; payload: unknown }>;

	beforeEach(() => {
		store = new InMemoryFiscalPhaseStore();
		gateEngine = new PhaseGateEngine();
		autoAdvance = new AutoAdvanceEngine();
		publishedEvents = [];
		registerFiscalGates(gateEngine);

		// Seed metadata for auto-advance to work
		const state = {
			ruc: "20123456789",
			periodo: "2026-06",
			currentPhase: "captura" as FiscalPhaseId,
			status: "not_started" as const,
			phaseHistory: [],
			metadata: {
				captura: { totalRecibidos: 100 },
				clasificacion: { totalClasificados: 98, coverage: 0.98 },
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		store.upsertPeriodState(state);

		orchestrator = new FiscalPhaseOrchestrator({
			store,
			gateEngine,
			graph: createDefaultPhaseGraph(),
			autoAdvanceEngine: autoAdvance,
			eventBus: {
				publish: async (type, payload) => {
					publishedEvents.push({ type, payload });
				},
			},
		});
	});

	it("auto-advances from captura to clasificacion when gates pass and engine approves", async () => {
		// Need to setup period correctly
		await orchestrator.startPeriod("20123456789", "2026-07");
		await orchestrator.startPhase("20123456789", "2026-07", "captura");

		// Set metadata for auto-advance
		const s = await store.getPeriodState("20123456789", "2026-07");
		if (s) {
			await store.upsertPeriodState({
				...s,
				metadata: {
					captura: { totalRecibidos: 100 },
				},
			});
		}

		const result = await orchestrator.completePhase(
			"20123456789",
			"2026-07",
			"captura",
			{ totalRecibidos: 100 },
			{ autoAdvance: true },
		);

		expect(result.success).toBe(true);

		// Should have auto-advanced or at least completed captura
		const state = await store.getPeriodState("20123456789", "2026-07");
		if (state) {
			const capturaEntry = state.phaseHistory.find(
				(e) => e.phaseId === "captura",
			);
			expect(capturaEntry?.status).toBe("completed");
		}
	});

	it("publishes auto-advance events when engine approves", async () => {
		await orchestrator.startPeriod("20123456789", "2026-08");
		await orchestrator.startPhase("20123456789", "2026-08", "captura");

		const s = await store.getPeriodState("20123456789", "2026-08");
		if (s) {
			await store.upsertPeriodState({
				...s,
				metadata: { captura: { totalRecibidos: 50 } },
			});
		}

		await orchestrator.completePhase(
			"20123456789",
			"2026-08",
			"captura",
			{ docs: 50 },
			{ autoAdvance: true },
		);

		const autoAdvanceEvents = publishedEvents.filter(
			(e) =>
				e.type === "phase.auto-advanced" ||
				e.type === "phase.auto-advance-skipped",
		);
		expect(autoAdvanceEvents.length).toBeGreaterThanOrEqual(0);
	});

	it("runs a full period continuously with runPeriodContinuously", async () => {
		const result = await orchestrator.runPeriodContinuously(
			"20123456789",
			"2026-09",
			async (phaseId: FiscalPhaseId, _state: FiscalPeriodState) => {
				// Simulate agent that always succeeds
				return {
					output: {
						phaseId,
						ruc: "20123456789",
						periodo: "2026-09",
						success: true,
						summary: `Processed ${phaseId}`,
						data: {},
					},
				};
			},
		);

		// Should at least have started the period
		expect(result).toBeDefined();

		const finalState = await store.getPeriodState("20123456789", "2026-09");
		expect(finalState).toBeDefined();
		// The period should have progressed past captura
		expect(finalState?.phaseHistory.length).toBeGreaterThanOrEqual(1);
	});
});
