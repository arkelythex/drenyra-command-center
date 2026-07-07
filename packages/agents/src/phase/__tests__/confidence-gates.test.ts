import { describe, expect, it } from "vitest";
import {
	confidenceGate,
	getPhaseConfidenceThreshold,
	loadConfidenceGateConfig,
	resetConfidenceGateConfigCache,
} from "../confidence-gates";
import type { FiscalPeriodState, PhaseGateContext } from "../types";

function createState(
	overrides?: Partial<FiscalPeriodState>,
): FiscalPeriodState {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		currentPhase: "clasificacion",
		status: "in_progress",
		phaseHistory: [],
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe("confidence-gates", () => {
	it("loads thresholds from fiscal-confidence-gates.yaml", () => {
		resetConfidenceGateConfigCache();
		const config = loadConfidenceGateConfig();
		expect(config.phases.declaracion.confidence_min).toBe(0.95);
		expect(config.phases.captura.confidence_min).toBe(0.9);
	});

	it("defers with warning when confidence is not reported (stub agents)", async () => {
		const gate = confidenceGate("captura");
		const state = createState({ currentPhase: "captura" });
		const result = await gate.evaluate(state, {} as PhaseGateContext);
		expect(result.passed).toBe(true);
		expect(result.severity).toBe("warning");
	});

	it("blocks when confidence is below phase threshold", async () => {
		const gate = confidenceGate("clasificacion");
		const state = createState({
			currentPhase: "clasificacion",
			metadata: {
				clasificacion: { confidence: 0.6, totalClasificados: 100 },
			},
		});

		const result = await gate.evaluate(state, {} as PhaseGateContext);
		expect(result.passed).toBe(false);
		expect(result.reason).toContain("0.60");
		expect(getPhaseConfidenceThreshold("clasificacion")).toBe(0.75);
	});

	it("passes when confidence meets threshold", async () => {
		const gate = confidenceGate("declaracion");
		const state = createState({
			currentPhase: "declaracion",
			metadata: {
				declaracion: { confidence: 0.96, presentada: true },
			},
		});

		const result = await gate.evaluate(state, {} as PhaseGateContext);
		expect(result.passed).toBe(true);
	});
});
