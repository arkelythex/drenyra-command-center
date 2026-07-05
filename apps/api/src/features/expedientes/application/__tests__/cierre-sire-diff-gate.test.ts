import {
	buildDefaultCierreChecklist,
	type CierreMensual,
} from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import { applySireDiffCommitChecklistGate } from "../cierre-sire-diff-gate";

function makeCierre(): CierreMensual {
	const checklist = buildDefaultCierreChecklist("exp-test");
	return {
		id: "CIERRE-2026-03-20123456789",
		companyRuc: "20123456789",
		companyName: "Test SAC",
		periodo: "2026-03",
		status: "EN_PROCESO",
		startedAt: new Date().toISOString(),
		checklist,
		progress: 0,
		expedienteId: "exp-test",
		firmas: {
			contador: { firmado: false },
			revisor: { firmado: false },
			representante: { firmado: false },
		},
		sireStatus: "PENDIENTE",
		bancosStatus: "PENDIENTE",
		igvStatus: "PENDIENTE",
		globalRiskLevel: "MEDIUM",
	};
}

describe("applySireDiffCommitChecklistGate", () => {
	it("leaves checklist unchanged when no diff commit audit", () => {
		const cierre = makeCierre();
		const result = applySireDiffCommitChecklistGate(cierre, false);
		expect(result).toBe(cierre);
	});

	it("auto-completes SIRE checklist items when audit exists", () => {
		const cierre = makeCierre();
		const result = applySireDiffCommitChecklistGate(cierre, true);
		const sireItems = result.checklist.filter((item) =>
			item.label.includes("Validación SIRE"),
		);
		expect(sireItems.every((item) => item.completado)).toBe(true);
		expect(result.sireStatus).toBe("CONCILIADO");
		expect(result.progress).toBeGreaterThan(cierre.progress);
	});
});
