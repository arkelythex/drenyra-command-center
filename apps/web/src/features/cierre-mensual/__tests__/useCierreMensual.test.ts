import type { MissionSnapshot } from "@drenyra/mission-domain";
import { describe, expect, it } from "vitest";
import { projectCierreMensualMission } from "../hooks/useCierreMensual";

const SNAPSHOT: MissionSnapshot = {
	id: "mission-1",
	companyId: "company-1",
	fiscalPeriod: "2026-03",
	intent: "monthly-close",
	status: "AWAITING_APPROVAL",
	version: 3,
	progress: 6_500,
	steps: [
		{
			id: "import",
			name: "Importar",
			status: "COMPLETED",
			completedAt: "2026-04-01T08:00:00Z",
		},
		{
			id: "review",
			name: "Revisar",
			status: "IN_PROGRESS",
			startedAt: "2026-04-01T09:00:00Z",
		},
	],
	currentStep: "review",
	blockers: [
		{
			id: "blocker-1",
			reason: "Evidencia pendiente",
			severity: "ERROR",
			occurredAt: "2026-04-01T09:05:00Z",
		},
	],
	proposal: null,
	rejection: null,
	receiptId: null,
	receiptHash: null,
	lastEventSequence: 4,
	createdAt: "2026-04-01T08:00:00Z",
	updatedAt: "2026-04-01T09:05:00Z",
};

describe("projectCierreMensualMission", () => {
	it("projects protocol progress, steps, and blockers for the close view", () => {
		const cierre = projectCierreMensualMission(SNAPSHOT, {
			companyId: "company-1",
			companyName: "Arkelythex SAC",
			companyRuc: "20123456789",
			fiscalPeriod: "2026-03",
		});

		expect(cierre.progress).toBe(0.65);
		expect(cierre.checklist).toMatchObject([
			{ id: "import", label: "Importar", completado: true },
			{ id: "review", label: "Revisar", completado: false },
		]);
		expect(cierre.blockers).toEqual([
			{
				id: "blocker-1",
				reason: "Evidencia pendiente",
				severity: "high",
				resolved: false,
				resolvedAt: undefined,
			},
		]);
	});
});

describe("projectCierreMensualMission: nothing invented", () => {
	const params = {
		companyId: "company-1",
		companyName: "Arkelythex SAC",
		companyRuc: "20123456789",
		fiscalPeriod: "2026-03",
	};

	it("links the close to the server's mission id", () => {
		const cierre = projectCierreMensualMission(
			{ ...SNAPSHOT, missionId: "mission-1" },
			params,
		);
		expect(cierre.id).toBe("mission-1");
		expect(cierre.expedienteId).toBe("mission-1");
	});

	it("does not report SIRE, banks or IGV as reconciled or in discrepancy without evidence", () => {
		const cierre = projectCierreMensualMission(
			{ ...SNAPSHOT, receiptId: "receipt-1" },
			params,
		);
		expect(cierre.sireStatus).toBe("PENDIENTE");
		expect(cierre.bancosStatus).toBe("PENDIENTE");
		expect(cierre.igvStatus).toBe("PENDIENTE");
	});

	it("only counts the approval as the accountant's signature", () => {
		expect(projectCierreMensualMission(SNAPSHOT, params).firmas).toEqual({
			contador: { firmado: false },
		});
		expect(
			projectCierreMensualMission({ ...SNAPSHOT, receiptId: "r-1" }, params)
				.firmas,
		).toEqual({ contador: { firmado: true } });
	});
});
