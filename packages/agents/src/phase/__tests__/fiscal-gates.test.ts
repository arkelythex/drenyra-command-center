// ─── Fiscal Gates Tests ─────────────────────────────────────────────
// Tests for all gate definitions in fiscal-gates.ts

import { describe, expect, it } from "vitest";
import {
	capturaCompleteGate,
	capturaDoneGate,
	cierreApprovalGate,
	clasificacionCompleteGate,
	conciliacionVarianceGate,
	declaracionFiledGate,
	periodoOpenGate,
	registerFiscalGates,
} from "../fiscal-gates";
import { PhaseGateEngine } from "../phase-gate-engine";
import type { FiscalPeriodState, PhaseGateContext } from "../types";

function createPeriodState(
	overrides?: Partial<FiscalPeriodState>,
): FiscalPeriodState {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		currentPhase: "captura",
		status: "not_started",
		phaseHistory: [],
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe("periodoOpenGate", () => {
	it("passes when period is not_started", async () => {
		const gate = periodoOpenGate();
		const state = createPeriodState();
		const ctx = { ruc: state.ruc, periodo: state.periodo } as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(true);
	});

	it("fails when period is already in_progress", async () => {
		const gate = periodoOpenGate();
		const state = createPeriodState({
			status: "in_progress",
			currentPhase: "captura",
		});
		const ctx = { ruc: state.ruc, periodo: state.periodo } as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("error");
	});

	it("fails critically when period is completed", async () => {
		const gate = periodoOpenGate();
		const state = createPeriodState({ status: "completed" });
		const ctx = { ruc: state.ruc, periodo: state.periodo } as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("critical");
	});
});

describe("capturaCompleteGate", () => {
	it("fails when no CPEs captured", async () => {
		const gate = capturaCompleteGate();
		const state = createPeriodState();
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
		expect(result.reason).toContain("No se capturaron");
	});

	it("passes when CPEs are captured in metadata", async () => {
		const gate = capturaCompleteGate();
		const state = createPeriodState({
			metadata: {
				captura: { totalRecibidos: 42 },
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(true);
	});
});

describe("clasificacionCompleteGate", () => {
	it("passes with high coverage", async () => {
		const gate = clasificacionCompleteGate();
		const state = createPeriodState({
			metadata: {
				captura: { totalRecibidos: 100 },
				clasificacion: { totalClasificados: 98 },
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(true);
	});

	it("passes with warning at medium coverage", async () => {
		const gate = clasificacionCompleteGate();
		const state = createPeriodState({
			metadata: {
				captura: { totalRecibidos: 100 },
				clasificacion: { totalClasificados: 82 },
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(true);
		expect(result.severity).toBe("warning");
	});

	it("blocks when coverage is below 80%", async () => {
		const gate = clasificacionCompleteGate();
		const state = createPeriodState({
			metadata: {
				captura: { totalRecibidos: 100 },
				clasificacion: { totalClasificados: 50 },
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
		expect(result.severity).toBe("error");
	});
});

describe("conciliacionVarianceGate", () => {
	it("passes when variance is within 5%", async () => {
		const gate = conciliacionVarianceGate();
		const state = createPeriodState({
			metadata: {
				conciliacion: { saldoLibro: 10000, saldoBanco: 10200, variance: 0.02 },
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(true);
	});

	it("blocks when variance exceeds 5%", async () => {
		const gate = conciliacionVarianceGate();
		const state = createPeriodState({
			metadata: {
				conciliacion: { saldoLibro: 10000, saldoBanco: 20000, variance: 0.5 },
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
	});
});

describe("cierreApprovalGate", () => {
	it("requires explicit approval in metadata", async () => {
		const gate = cierreApprovalGate();
		const state = createPeriodState();
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
		expect(result.reason).toContain("aprobación manual");
	});

	it("passes when cierre is approved in metadata", async () => {
		const gate = cierreApprovalGate();
		const state = createPeriodState({
			metadata: {
				cierre: { approved: true, approvedAt: new Date().toISOString() },
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(true);
	});
});

describe("declaracionFiledGate", () => {
	it("fails if declaracion not in metadata", async () => {
		const gate = declaracionFiledGate();
		const state = createPeriodState();
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
	});

	it("fails if declaracion has observations", async () => {
		const gate = declaracionFiledGate();
		const state = createPeriodState({
			metadata: {
				declaracion: {
					presentada: true,
					observaciones: ["Detracción sin constancia"],
				},
			},
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
		expect(result.reason).toContain("observaciones");
	});
});

describe("capturaDoneGate / declaracionDoneGate (completeness gates)", () => {
	it("capturaDoneGate passes if captura phase completed", async () => {
		const gate = capturaDoneGate();
		const state = createPeriodState({
			currentPhase: "clasificacion",
			phaseHistory: [
				{
					phaseId: "captura",
					status: "completed",
					startedAt: new Date(),
					completedAt: new Date(),
					gateResults: [],
				},
			],
		});
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(true);
	});

	it("capturaDoneGate fails if captura not complete", async () => {
		const gate = capturaDoneGate();
		const state = createPeriodState();
		const ctx = {} as PhaseGateContext;

		const result = await gate.evaluate(state, ctx);
		expect(result.passed).toBe(false);
	});
});

describe("registerFiscalGates", () => {
	it("registers all 11 fiscal gates", () => {
		const engine = new PhaseGateEngine();
		registerFiscalGates(engine);

		const gates = engine.listGates();
		expect(gates).toHaveLength(17);
		expect(gates).toContain("periodo-open");
		expect(gates).toContain("captura-complete");
		expect(gates).toContain("captura-done");
		expect(gates).toContain("clasificacion-complete");
		expect(gates).toContain("clasificacion-done");
		expect(gates).toContain("conciliacion-variance");
		expect(gates).toContain("conciliacion-done");
		expect(gates).toContain("cierre-approval");
		expect(gates).toContain("cierre-done");
		expect(gates).toContain("declaracion-filed");
		expect(gates).toContain("declaracion-done");
	});
});
