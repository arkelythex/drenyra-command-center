import { describe, expect, it } from "vitest";
import { conciliacionVarianceGate } from "../fiscal-gates";
import {
	createInMemoryGateEvidenceRecorder,
	gateResultToEvidenceRecord,
} from "../gate-evidence-recorder";
import { PhaseGateEngine } from "../phase-gate-engine";
import type { FiscalPeriodState, PhaseGateContext } from "../types";

function createState(
	overrides?: Partial<FiscalPeriodState>,
): FiscalPeriodState {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		currentPhase: "conciliacion",
		status: "in_progress",
		phaseHistory: [],
		metadata: {
			conciliacion: { saldoLibro: 10000, saldoBanco: 20000, variance: 0.5 },
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe("gate-evidence-recorder", () => {
	it("produces condensed T3 summary for blocking gates", () => {
		const result = gateResultToEvidenceRecord(
			{
				gateId: "conciliacion-variance",
				gateName: "Varianza de Conciliación",
				passed: false,
				severity: "error",
				reason: "Consistency check failed",
				evaluatedAt: new Date(),
			},
			{
				ruc: "20123456789",
				periodo: "2026-06",
				currentPhase: "conciliacion",
				targetPhase: "cierre",
				phaseState: {
					phaseId: "conciliacion",
					status: "in_progress",
					gateResults: [],
				},
				periodState: createState(),
			},
		);

		expect(result.tier).toBe("T3_CRITICAL");
		expect(result.summary).toContain("blocked");
		expect(result.summary.length).toBeLessThanOrEqual(240);
	});

	it("records evidence via PhaseGateEngine hook", async () => {
		const recorder = createInMemoryGateEvidenceRecorder();
		const engine = new PhaseGateEngine({ evidenceRecorder: recorder });
		engine.registerGate(conciliacionVarianceGate());

		const state = createState();
		const context = {
			ruc: state.ruc,
			periodo: state.periodo,
			currentPhase: "conciliacion" as const,
			targetPhase: "cierre" as const,
			phaseState: {
				phaseId: "conciliacion" as const,
				status: "in_progress" as const,
				gateResults: [],
			},
			periodState: state,
		} satisfies PhaseGateContext;

		await engine.evaluateGate("conciliacion-variance", state, context);

		expect(recorder.entries).toHaveLength(1);
		expect(recorder.entries[0]?.gateId).toBe("conciliacion-variance");
		expect(recorder.entries[0]?.summary).toBeTruthy();
	});
});
