import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AuditoriaAgent,
	type AuditoriaAgentInput,
} from "../phase-agents/auditoria.agent";
import type { FiscalPeriodState, FiscalPhaseId } from "../types";

const ORDER: FiscalPhaseId[] = [
	"captura",
	"clasificacion",
	"conciliacion",
	"cierre",
	"declaracion",
];

type Gate = {
	passed: boolean;
	severity: "info" | "warning" | "error" | "critical";
};

function entry(
	phaseId: FiscalPhaseId,
	day: number,
	status = "completed",
	gates: Gate[] = [],
) {
	return {
		phaseId,
		status,
		startedAt: new Date(2026, 5, day),
		completedAt: new Date(2026, 5, day + 1),
		gateResults: gates.map((g, i) => ({
			gateId: `g${i}`,
			gateName: `G${i}`,
			evaluatedAt: new Date(2026, 5, day),
			...g,
		})),
	};
}

function input(
	history: ReturnType<typeof entry>[],
	externalChecks?: AuditoriaAgentInput["externalChecks"],
): AuditoriaAgentInput {
	return {
		ruc: "20123456789",
		periodo: "2026-06",
		periodState: {
			ruc: "20123456789",
			periodo: "2026-06",
			currentPhase: "auditoria",
			status: "in_progress",
			phaseHistory: history,
			metadata: {},
			createdAt: new Date(2026, 5, 1),
			updatedAt: new Date(2026, 5, 1),
		} as unknown as FiscalPeriodState,
		...(externalChecks ? { externalChecks } : {}),
	};
}

const complete = () => ORDER.map((p, i) => entry(p, 1 + i * 2));

describe("AuditoriaAgent (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));
	});
	afterEach(() => vi.useRealTimers());

	const scenarios: Record<string, AuditoriaAgentInput> = {
		"all phases complete, no findings": input(complete()),
		"two phases missing": input(complete().slice(0, 3)),
		"nothing completed": input(ORDER.map((p, i) => entry(p, 1 + i, "pending"))),
		"failed critical and error gates": input([
			entry("captura", 1, "completed", [
				{ passed: false, severity: "critical" },
				{ passed: false, severity: "error" },
				{ passed: false, severity: "warning" },
				{ passed: true, severity: "error" },
			]),
			...complete().slice(1),
		]),
		"out-of-order execution": input([
			entry("clasificacion", 1),
			entry("captura", 3),
			...complete().slice(2),
		]),
		"external checks failing and passing": input(complete(), [
			{ name: "SIRE vs Libro", passed: false, detail: "Diferencia de S/ 120" },
			{ name: "Detracciones", passed: true, detail: "ok" },
			{ name: "PLE  Ventas", passed: false, detail: "Falta archivo" },
		]),
		"everything wrong": input(
			[
				entry("cierre", 1, "completed", [
					{ passed: false, severity: "critical" },
				]),
				entry("captura", 3),
			],
			[{ name: "X", passed: false, detail: "d" }],
		),
	};

	for (const [name, scenario] of Object.entries(scenarios)) {
		it(`pins the full report: ${name}`, async () => {
			const report = await new AuditoriaAgent().execute(scenario);
			expect(report).toMatchSnapshot();
		});
	}

	it("sanity: complete period closes with high confidence", async () => {
		const report = await new AuditoriaAgent().execute(
			scenarios["all phases complete, no findings"],
		);
		expect(report.data.periodoCerrado).toBe(true);
		expect(report.data.confianza).toBe(1);
	});
});
