// ─── Phase Agent Tests ──────────────────────────────────────────────
// Tests for all 6 phase agents.

import { beforeEach, describe, expect, it } from "vitest";
import { AuditoriaAgent } from "../phase-agents/auditoria.agent";
import { CapturaAgent } from "../phase-agents/captura.agent";
import { CierreAgent } from "../phase-agents/cierre.agent";
import { ClasificacionAgent } from "../phase-agents/clasificacion.agent";
import { ConciliacionAgent } from "../phase-agents/conciliacion.agent";
import { DeclaracionAgent } from "../phase-agents/declaracion.agent";
import type { FiscalPeriodState } from "../types";

// ─── Captura Agent ──────────────────────────────────────────────────

describe("CapturaAgent", () => {
	let agent: CapturaAgent;

	beforeEach(() => {
		agent = new CapturaAgent();
	});

	it("returns a CapturaReport with phaseId captura", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result.phaseId).toBe("captura");
		expect(result.success).toBe(true);
		expect(result.data).toBeDefined();
		expect(result.data.totalRecibidos).toBeTypeOf("number");
	});
});

// ─── Clasificación Agent ────────────────────────────────────────────

describe("ClasificacionAgent", () => {
	let agent: ClasificacionAgent;

	beforeEach(() => {
		agent = new ClasificacionAgent();
	});

	it("classifies facturas as PCGE 60 with IGV", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			cpes: [
				{
					id: "CPE-001",
					tipo: "factura",
					monto: 1180,
					fecha: "2026-06-15",
					proveedorRuc: "10123456789",
				},
			],
		});

		expect(result.data.totalProcesados).toBe(1);
		expect(result.data.totalClasificados).toBe(1);
		expect(result.data.clasificaciones[0].cuentaPCGE).toBe("60");
		expect(result.data.clasificaciones[0].igvCalculado).toBe(180); // 1180/1.18*0.18
		expect(result.data.cobertura).toBe(1);
	});

	it("flags unknown document types as ambiguous", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			cpes: [
				{
					id: "CPE-001",
					tipo: "unknown-type",
					monto: 500,
					fecha: "2026-06-15",
				},
			],
		});

		expect(result.data.totalClasificados).toBe(0);
		expect(result.data.totalAmbiguos).toBe(1);
		expect(result.data.cobertura).toBe(0);
	});

	it("returns 0 IGV for export operations", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			cpes: [
				{
					id: "CPE-002",
					tipo: "exportacion",
					monto: 5000,
					fecha: "2026-06-10",
				},
			],
		});

		expect(result.data.clasificaciones[0].igvCalculado).toBe(0);
	});

	it("handles empty CPE list", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			cpes: [],
		});

		expect(result.data.totalProcesados).toBe(0);
		expect(result.data.cobertura).toBe(1); // edge case: no items = 100% coverage
	});
});

// ─── Conciliación Agent ─────────────────────────────────────────────

describe("ConciliacionAgent", () => {
	let agent: ConciliacionAgent;

	beforeEach(() => {
		agent = new ConciliacionAgent();
	});

	it("matches transactions by amount + date", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			transaccionesLibro: [
				{
					id: "T-001",
					monto: 1000,
					fecha: "2026-06-15",
					descripcion: "Pago proveedor",
				},
				{ id: "T-002", monto: 500, fecha: "2026-06-20", descripcion: "Venta" },
			],
			movimientosBanco: [
				{
					id: "M-001",
					monto: 1000,
					fecha: "2026-06-15",
					referencia: "TRANSFERENCIA A",
				},
				{
					id: "M-002",
					monto: 500,
					fecha: "2026-06-20",
					referencia: "DEPÓSITO B",
				},
			],
		});

		expect(result.data.paresConciliados).toBe(2);
		expect(result.data.discrepancias).toBe(0);
		expect(result.data.variance).toBe(0);
	});

	it("flags discrepancies when transactions don't match", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			transaccionesLibro: [
				{
					id: "T-001",
					monto: 1000,
					fecha: "2026-06-15",
					descripcion: "Pago proveedor",
				},
			],
			movimientosBanco: [
				{ id: "M-001", monto: 2000, fecha: "2026-06-15", referencia: "OTRO" },
			],
		});

		expect(result.data.paresConciliados).toBe(0);
		expect(result.data.discrepancias).toBe(2);
	});

	it("computes variance correctly", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			transaccionesLibro: [
				{ id: "T-001", monto: 1000, fecha: "2026-06-15", descripcion: "Test" },
			],
			movimientosBanco: [
				{ id: "M-001", monto: 950, fecha: "2026-06-15", referencia: "Test" },
			],
			saldoLibro: 1000,
			saldoBanco: 950,
		});

		expect(result.data.variance).toBeCloseTo(0.05, 2); // 50/1000 = 5%
	});
});

// ─── Cierre Agent ──────────────────────────────────────────────────

describe("CierreAgent", () => {
	let agent: CierreAgent;

	beforeEach(() => {
		agent = new CierreAgent();
	});

	it("computes final balances for all accounts", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			cuentas: [
				{
					cuentaPCGE: "10",
					nombre: "Caja",
					saldoInicial: 5000,
					movimientosDebe: 2000,
					movimientosHaber: 1000,
				},
				{
					cuentaPCGE: "60",
					nombre: "Compras",
					saldoInicial: 3000,
					movimientosDebe: 1500,
					movimientosHaber: 500,
				},
			],
		});

		expect(result.data.totalCuentas).toBe(2);
		expect(result.data.saldosFinales[0].saldo).toBe(6000); // 5000 + 2000 - 1000
		expect(result.data.saldosFinales[1].saldo).toBe(4000); // 3000 + 1500 - 500
	});

	it("applies adjustments to correct accounts", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			cuentas: [
				{
					cuentaPCGE: "10",
					nombre: "Caja",
					saldoInicial: 1000,
					movimientosDebe: 0,
					movimientosHaber: 0,
				},
			],
			ajustes: [
				{
					id: "ADJ-001",
					cuentaPCGE: "10",
					tipo: "diferencia-cambio",
					monto: 200,
					descripcion: "FX adj",
				},
			],
		});

		expect(result.data.saldosFinales[0].debe).toBe(200);
		expect(result.data.saldosFinales[0].saldo).toBe(1200);
		expect(result.data.ajustes).toBe(1);
	});
});

// ─── Declaración Agent ─────────────────────────────────────────────

describe("DeclaracionAgent", () => {
	let agent: DeclaracionAgent;

	beforeEach(() => {
		agent = new DeclaracionAgent();
	});

	it("submits successfully with complete data", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			tipoDeclaracion: "SIRE",
			resumenPLE: {
				cantidadComprobantes: 50,
				totalVentas: 100000,
				totalCompras: 60000,
				igvVentas: 18000,
				igvCompras: 10800,
			},
		});

		expect(result.data.presentada).toBe(true);
		expect(result.data.cdrId).toBeDefined();
		expect(result.data.numeroComprobante).toContain("202606");
	});

	it("returns observations when PLE resumen is missing", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			tipoDeclaracion: "PDT",
		});

		expect(result.success).toBe(false);
		expect(result.phaseId).toBe("declaracion");
		expect(result.data.presentada).toBe(false);
	});
});

// ─── Auditoría Agent ──────────────────────────────────────────────

describe("AuditoriaAgent", () => {
	let agent: AuditoriaAgent;
	let basePeriodState: FiscalPeriodState;

	beforeEach(() => {
		agent = new AuditoriaAgent();
		basePeriodState = {
			ruc: "20123456789",
			periodo: "2026-06",
			currentPhase: "auditoria",
			status: "in_progress",
			phaseHistory: [
				{
					phaseId: "captura",
					status: "completed",
					startedAt: new Date("2026-06-01"),
					completedAt: new Date("2026-06-02"),
					gateResults: [
						{
							gateId: "g1",
							gateName: "G1",
							passed: true,
							severity: "info",
							evaluatedAt: new Date(),
						},
					],
				},
				{
					phaseId: "clasificacion",
					status: "completed",
					startedAt: new Date("2026-06-03"),
					completedAt: new Date("2026-06-04"),
					gateResults: [],
				},
				{
					phaseId: "conciliacion",
					status: "completed",
					startedAt: new Date("2026-06-05"),
					completedAt: new Date("2026-06-06"),
					gateResults: [],
				},
				{
					phaseId: "cierre",
					status: "completed",
					startedAt: new Date("2026-06-07"),
					completedAt: new Date("2026-06-08"),
					gateResults: [],
				},
				{
					phaseId: "declaracion",
					status: "completed",
					startedAt: new Date("2026-06-09"),
					completedAt: new Date("2026-06-10"),
					gateResults: [],
				},
				{
					phaseId: "auditoria",
					status: "in_progress",
					startedAt: new Date("2026-06-11"),
					gateResults: [],
				},
			],
			metadata: {},
			createdAt: new Date("2026-06-01"),
			updatedAt: new Date("2026-06-11"),
		};
	});

	it("returns high confidence when all phases complete with no issues", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			periodState: basePeriodState,
		});

		expect(result.data.confianza).toBeGreaterThanOrEqual(0.7);
		expect(result.data.hallazgos.length).toBe(0);
		expect(result.data.periodoCerrado).toBe(true);
	});

	it("flags missing phases", async () => {
		const state: FiscalPeriodState = {
			...basePeriodState,
			phaseHistory: basePeriodState.phaseHistory.filter(
				(e) => e.phaseId !== "declaracion",
			),
		};

		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			periodState: state,
		});

		const hallazgo = result.data.hallazgos.find(
			(h) => h.id === "phase-declaracion-missing",
		);
		expect(hallazgo).toBeDefined();
		expect(hallazgo?.tipo).toBe("error");
		expect(result.data.confianza).toBeLessThan(1);
	});

	it("includes external check results", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			periodState: basePeriodState,
			externalChecks: [
				{ name: "IGV Consistency", passed: true, detail: "IGV matches" },
				{
					name: "Detracciones Paid",
					passed: false,
					detail: "2 detracciones pendientes",
				},
			],
		});

		const hallazgo = result.data.hallazgos.find(
			(h) => h.id === "external-detracciones-paid",
		);
		expect(hallazgo).toBeDefined();
	});

	it("generates a non-empty memo", async () => {
		const result = await agent.execute({
			ruc: "20123456789",
			periodo: "2026-06",
			periodState: basePeriodState,
		});

		expect(result.data.memo.length).toBeGreaterThan(50);
		expect(result.data.memo).toContain("INFORME DE AUDITORÍA FISCAL");
		expect(result.data.memo).toContain("20123456789");
	});
});
