// ─── Full Cycle Integration Test ────────────────────────────────────
// Tests a complete fiscal cycle: Captura → Clasificación → Conciliación
// → Cierre → Declaración → Auditoría with real gates and phase agents.

import { describe, expect, it } from "vitest";
import { registerFiscalGates } from "../fiscal-gates";
import { createDefaultPhaseGraph } from "../fiscal-phase-graph";
import { FiscalPhaseOrchestrator } from "../fiscal-phase-orchestrator";
import { InMemoryFiscalPhaseStore } from "../fiscal-phase-store";
import { AuditoriaAgent } from "../phase-agents/auditoria.agent";
import { CapturaAgent } from "../phase-agents/captura.agent";
import { CierreAgent } from "../phase-agents/cierre.agent";
import { ClasificacionAgent } from "../phase-agents/clasificacion.agent";
import { ConciliacionAgent } from "../phase-agents/conciliacion.agent";
import { DeclaracionAgent } from "../phase-agents/declaracion.agent";
import { PhaseGateEngine } from "../phase-gate-engine";

/**
 * Helper: run a full fiscal cycle end-to-end.
 * Phase agents are orchestrated manually (the orchestrator manages state + gates,
 * the caller invokes agents). This simulates the real dual-layer flow.
 */
async function runFullCycle(ruc: string, periodo: string) {
	const store = new InMemoryFiscalPhaseStore();
	const gateEngine = new PhaseGateEngine();
	registerFiscalGates(gateEngine);

	const publishedEvents: Array<{ type: string; payload: unknown }> = [];

	const orchestrator = new FiscalPhaseOrchestrator({
		store,
		gateEngine,
		graph: createDefaultPhaseGraph(),
		eventBus: {
			publish: async (type, payload) => {
				publishedEvents.push({ type, payload });
			},
		},
	});

	// Initialize agents
	const captura = new CapturaAgent();
	const clasificacion = new ClasificacionAgent();
	const conciliacion = new ConciliacionAgent();
	const cierre = new CierreAgent();
	const declaracion = new DeclaracionAgent();
	const auditoria = new AuditoriaAgent();

	// Phase 1: Captura
	let result = await orchestrator.startPeriod(ruc, periodo);
	if (!result.success) throw new Error(`startPeriod failed: ${result.error}`);

	result = await orchestrator.startPhase(ruc, periodo, "captura");
	if (!result.success)
		throw new Error(`startPhase captura failed: ${result.error}`);

	// Set metadata for gate pass
	await store.upsertPeriodState({
		...(await store.getPeriodState(ruc, periodo))!,
		metadata: {
			captura: { totalRecibidos: 50 },
		},
	});

	const capturaResult = await captura.execute({ ruc, periodo });

	let execResult = await orchestrator.completePhase(
		ruc,
		periodo,
		"captura",
		capturaResult.data,
		{
			autoAdvance: true,
		},
	);
	if (!execResult.success)
		throw new Error(
			`completePhase captura failed: ${execResult.error ?? execResult.gateResult.summary}`,
		);

	// Phase 2: Clasificación
	result = await orchestrator.startPhase(ruc, periodo, "clasificacion");
	if (!result.success)
		throw new Error(`startPhase clasificacion failed: ${result.error}`);

	const clasificacionInput = {
		ruc,
		periodo,
		cpes: Array.from({ length: 50 }, (_, i) => ({
			id: `CPE-${String(i + 1).padStart(3, "0")}`,
			tipo: i < 45 ? "factura" : "unknown-type",
			monto: 100 * (i + 1),
			fecha: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`,
		})),
	};
	const clasificacionResult = await clasificacion.execute(clasificacionInput);

	await store.upsertPeriodState({
		...(await store.getPeriodState(ruc, periodo))!,
		metadata: {
			captura: { totalRecibidos: 50 },
			clasificacion: {
				totalClasificados: clasificacionResult.data.totalClasificados,
			},
		},
	});

	execResult = await orchestrator.completePhase(
		ruc,
		periodo,
		"clasificacion",
		clasificacionResult.data,
		{
			autoAdvance: true,
		},
	);
	if (!execResult.success)
		throw new Error(
			`completePhase clasificacion failed: ${execResult.error ?? execResult.gateResult.summary}`,
		);

	// Phase 3: Conciliación
	result = await orchestrator.startPhase(ruc, periodo, "conciliacion");
	if (!result.success)
		throw new Error(`startPhase conciliacion failed: ${result.error}`);

	const conciliacionResult = await conciliacion.execute({
		ruc,
		periodo,
		transaccionesLibro: [
			{ id: "T-001", monto: 50000, fecha: "2026-06-15", descripcion: "Ventas" },
			{
				id: "T-002",
				monto: 30000,
				fecha: "2026-06-20",
				descripcion: "Compras",
			},
		],
		movimientosBanco: [
			{
				id: "M-001",
				monto: 50000,
				fecha: "2026-06-15",
				referencia: "Depósito ventas",
			},
			{
				id: "M-002",
				monto: 30000,
				fecha: "2026-06-20",
				referencia: "Pago proveedores",
			},
		],
		saldoLibro: 80000,
		saldoBanco: 80000,
	});

	await store.upsertPeriodState({
		...(await store.getPeriodState(ruc, periodo))!,
		metadata: {
			captura: { totalRecibidos: 50 },
			clasificacion: {
				totalClasificados: clasificacionResult.data.totalClasificados,
			},
			conciliacion: {
				saldoLibro: conciliacionResult.data.saldoLibro,
				saldoBanco: conciliacionResult.data.saldoBanco,
				variance: conciliacionResult.data.variance,
				paresConciliados: conciliacionResult.data.paresConciliados,
			},
		},
	});

	execResult = await orchestrator.completePhase(
		ruc,
		periodo,
		"conciliacion",
		conciliacionResult.data,
		{
			autoAdvance: true,
		},
	);
	if (!execResult.success)
		throw new Error(
			`completePhase conciliacion failed: ${execResult.error ?? execResult.gateResult.summary}`,
		);

	// Phase 4: Cierre (requires human approval)
	result = await orchestrator.startPhase(ruc, periodo, "cierre");
	if (!result.success)
		throw new Error(`startPhase cierre failed: ${result.error}`);

	const cierreResult = await cierre.execute({
		ruc,
		periodo,
		cuentas: [
			{
				cuentaPCGE: "10",
				nombre: "Caja",
				saldoInicial: 80000,
				movimientosDebe: 100000,
				movimientosHaber: 60000,
			},
			{
				cuentaPCGE: "12",
				nombre: "Bancos",
				saldoInicial: 150000,
				movimientosDebe: 50000,
				movimientosHaber: 0,
			},
			{
				cuentaPCGE: "40",
				nombre: "Tributos",
				saldoInicial: 0,
				movimientosDebe: 0,
				movimientosHaber: 18000,
			},
		],
	});

	// Approve cierre in metadata (simulates human approval)
	await store.upsertPeriodState({
		...(await store.getPeriodState(ruc, periodo))!,
		metadata: {
			captura: { totalRecibidos: 50 },
			clasificacion: {
				totalClasificados: clasificacionResult.data.totalClasificados,
			},
			conciliacion: {
				saldoLibro: conciliacionResult.data.saldoLibro,
				saldoBanco: conciliacionResult.data.saldoBanco,
				variance: conciliacionResult.data.variance,
			},
			cierre: { approved: true, approvedAt: new Date().toISOString() },
		},
	});

	execResult = await orchestrator.completePhase(
		ruc,
		periodo,
		"cierre",
		cierreResult.data,
		{
			autoAdvance: true,
		},
	);
	if (!execResult.success)
		throw new Error(
			`completePhase cierre failed: ${execResult.error ?? execResult.gateResult.summary}`,
		);

	// Phase 5: Declaración
	result = await orchestrator.startPhase(ruc, periodo, "declaracion");
	if (!result.success)
		throw new Error(`startPhase declaracion failed: ${result.error}`);

	const declaracionResult = await declaracion.execute({
		ruc,
		periodo,
		tipoDeclaracion: "SIRE",
		resumenPLE: {
			cantidadComprobantes: 50,
			totalVentas: 100000,
			totalCompras: 60000,
			igvVentas: 18000,
			igvCompras: 10800,
		},
	});

	await store.upsertPeriodState({
		...(await store.getPeriodState(ruc, periodo))!,
		metadata: {
			captura: { totalRecibidos: 50 },
			clasificacion: {
				totalClasificados: clasificacionResult.data.totalClasificados,
			},
			conciliacion: {
				saldoLibro: conciliacionResult.data.saldoLibro,
				saldoBanco: conciliacionResult.data.saldoBanco,
				variance: conciliacionResult.data.variance,
			},
			cierre: { approved: true },
			declaracion: {
				presentada: declaracionResult.data.presentada,
				observaciones: declaracionResult.data.observaciones,
			},
		},
	});

	execResult = await orchestrator.completePhase(
		ruc,
		periodo,
		"declaracion",
		declaracionResult.data,
		{
			autoAdvance: true,
		},
	);
	if (!execResult.success)
		throw new Error(
			`completePhase declaracion failed: ${execResult.error ?? execResult.gateResult.summary}`,
		);

	// Phase 6: Auditoría
	result = await orchestrator.startPhase(ruc, periodo, "auditoria");
	if (!result.success)
		throw new Error(`startPhase auditoria failed: ${result.error}`);

	const periodState = await store.getPeriodState(ruc, periodo);
	const auditoriaResult = await auditoria.execute({
		ruc,
		periodo,
		periodState: periodState!,
	});

	execResult = await orchestrator.completePhase(
		ruc,
		periodo,
		"auditoria",
		auditoriaResult.data,
	);
	if (!execResult.success)
		throw new Error(
			`completePhase auditoria failed: ${execResult.error ?? execResult.gateResult.summary}`,
		);

	return {
		orchestrator,
		store,
		gateEngine,
		publishedEvents,
		results: {
			capturaResult,
			clasificacionResult,
			conciliacionResult,
			cierreResult,
			declaracionResult,
			auditoriaResult,
		},
	};
}

describe("Full Fiscal Cycle", () => {
	it("completes a full 6-phase cycle with all gates passing and agents executing", async () => {
		const { store, results, publishedEvents } = await runFullCycle(
			"20123456789",
			"2026-06",
		);

		// All phases should be completed
		const state = await store.getPeriodState("20123456789", "2026-06");
		expect(state).toBeDefined();
		expect(state?.currentPhase).toBe("auditoria");

		const completedPhases = state?.phaseHistory.filter(
			(e) => e.status === "completed",
		);
		expect(completedPhases).toHaveLength(6);

		// All agents produced output
		expect(results.capturaResult.phaseId).toBe("captura");
		expect(results.clasificacionResult.phaseId).toBe("clasificacion");
		expect(results.conciliacionResult.phaseId).toBe("conciliacion");
		expect(results.cierreResult.phaseId).toBe("cierre");
		expect(results.declaracionResult.phaseId).toBe("declaracion");
		expect(results.auditoriaResult.phaseId).toBe("auditoria");

		// Gate evaluations in history
		const allGateResults = state?.phaseHistory.flatMap((e) => e.gateResults);
		expect(allGateResults.length).toBeGreaterThan(0);

		// Only clasificacion gate should have warnings due to ambiguous CPEs
		const failedGates = allGateResults.filter((g) => !g.passed);
		expect(failedGates.length).toBe(0); // clasificacion coverage > 80% so it passes

		// Events published
		expect(publishedEvents.length).toBeGreaterThan(0);
		expect(publishedEvents.some((e) => e.type === "phase.started")).toBe(true);
		expect(publishedEvents.some((e) => e.type === "phase.completed")).toBe(
			true,
		);
		expect(publishedEvents.some((e) => e.type === "phase.period.started")).toBe(
			true,
		);

		// Auditoría should have cleared the cycle
		expect(results.auditoriaResult.data.confianza).toBeGreaterThan(0.7);
		expect(results.auditoriaResult.data.periodoCerrado).toBe(true);
	});

	it("blocked cycle when conciliacion variance gate fails", async () => {
		const store = new InMemoryFiscalPhaseStore();
		const gateEngine = new PhaseGateEngine();
		registerFiscalGates(gateEngine);

		const orchestrator = new FiscalPhaseOrchestrator({
			store,
			gateEngine,
			graph: createDefaultPhaseGraph(),
		});

		// Start period and skip to conciliacion
		await orchestrator.startPeriod("20123456789", "2026-06");

		// Force advance through captura and clasificacion with metadata
		await store.upsertPeriodState({
			...(await store.getPeriodState("20123456789", "2026-06"))!,
			status: "in_progress",
			currentPhase: "conciliacion",
			phaseHistory: [
				{
					phaseId: "captura",
					status: "completed",
					startedAt: new Date(),
					completedAt: new Date(),
					gateResults: [],
				},
				{
					phaseId: "clasificacion",
					status: "completed",
					startedAt: new Date(),
					completedAt: new Date(),
					gateResults: [],
				},
			],
			metadata: {
				conciliacion: { saldoLibro: 100000, saldoBanco: 50000, variance: 0.5 },
			},
		});

		// Start conciliacion
		const startResult = await orchestrator.startPhase(
			"20123456789",
			"2026-06",
			"conciliacion",
		);
		expect(startResult.success).toBe(true);

		// Complete with high variance — should block
		const completeResult = await orchestrator.completePhase(
			"20123456789",
			"2026-06",
			"conciliacion",
			{ variance: 0.5 },
		);

		expect(completeResult.success).toBe(false);
		expect(completeResult.gateResult.allPassed).toBe(false);
		expect(completeResult.gateResult.blockers.length).toBeGreaterThan(0);
	});

	it("blocked cycle when cierre approval is missing", async () => {
		const store = new InMemoryFiscalPhaseStore();
		const gateEngine = new PhaseGateEngine();
		registerFiscalGates(gateEngine);

		const orchestrator = new FiscalPhaseOrchestrator({
			store,
			gateEngine,
			graph: createDefaultPhaseGraph(),
		});

		await orchestrator.startPeriod("20123456789", "2026-06");

		// Force advance to cierre with all previous phases done
		await store.upsertPeriodState({
			...(await store.getPeriodState("20123456789", "2026-06"))!,
			status: "in_progress",
			currentPhase: "cierre",
			phaseHistory: [
				{
					phaseId: "captura",
					status: "completed",
					startedAt: new Date(),
					completedAt: new Date(),
					gateResults: [],
				},
				{
					phaseId: "clasificacion",
					status: "completed",
					startedAt: new Date(),
					completedAt: new Date(),
					gateResults: [],
				},
				{
					phaseId: "conciliacion",
					status: "completed",
					startedAt: new Date(),
					completedAt: new Date(),
					gateResults: [],
				},
			],
			metadata: { conciliacion: { saldoLibro: 100, saldoBanco: 100 } },
		});

		await orchestrator.startPhase("20123456789", "2026-06", "cierre");

		// No approval in metadata — should block
		const completeResult = await orchestrator.completePhase(
			"20123456789",
			"2026-06",
			"cierre",
			{ accounts: 10 },
		);
		expect(completeResult.success).toBe(false);
		expect(completeResult.gateResult.summary).toContain("Blocked");
	});
});
