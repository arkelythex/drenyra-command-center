import type {
	FiscalPeriodSummary,
	FiscalTransaction,
} from "@drenyra/domain/fiscal";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FiscalSummaryService } from "../fiscal-summary-service";

type Over = {
	sireCategory?: string;
	igvTreatment?: string;
	base?: number;
	igv?: number;
	detraccion?: { aplica: boolean; monto: number; estado?: string };
	percepcion?: { aplica: boolean; monto: number };
	retencion?: { aplica: boolean; monto: number };
	confidence?: number;
};

function tx(
	o: Over = {},
	ruc = "20123456786",
	periodo = "2026-07",
): FiscalTransaction {
	return {
		companyRuc: ruc,
		classification: {
			periodo,
			sireCategory: o.sireCategory ?? "VENTAS",
			igvTreatment: o.igvTreatment ?? "GRAVADO",
			baseImponible: o.base ?? 100,
			igvAmount: o.igv ?? 18,
			detraccion: o.detraccion ?? {
				aplica: false,
				monto: 0,
				estado: "NO_APLICA",
			},
			percepcion: o.percepcion ?? { aplica: false, monto: 0 },
			retencion: o.retencion ?? { aplica: false, monto: 0 },
			confidence: o.confidence ?? 0.95,
		},
	} as unknown as FiscalTransaction;
}

describe("FiscalSummaryService (characterization)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-01T00:00:00.000Z"));
	});
	afterEach(() => vi.useRealTimers());

	const sets: Record<string, FiscalTransaction[]> = {
		empty: [],
		"single sale": [tx()],
		"single purchase": [
			tx({ sireCategory: "COMPRAS", base: 250.5, igv: 45.09 }),
		],
		"sales mix incl. exonerado and inafecto": [
			tx(),
			tx({ igvTreatment: "EXONERADO", base: 40, igv: 0 }),
			tx({ igvTreatment: "INAFECTO", base: 60, igv: 0 }),
			tx({ sireCategory: "COMPRAS", base: 30, igv: 5.4 }),
		],
		"igv a favor": [
			tx({ igv: 10 }),
			tx({ sireCategory: "COMPRAS", igv: 99.99 }),
		],
		"detracciones pendientes and paid": [
			tx({ detraccion: { aplica: true, monto: 120.55, estado: "PENDIENTE" } }),
			tx({ detraccion: { aplica: true, monto: 80, estado: "DEPOSITADA" } }),
			tx({ detraccion: { aplica: false, monto: 999, estado: "PENDIENTE" } }),
		],
		"percepciones and retenciones": [
			tx({
				percepcion: { aplica: true, monto: 3.3 },
				retencion: { aplica: true, monto: 1.1 },
			}),
			tx({
				percepcion: { aplica: false, monto: 50 },
				retencion: { aplica: false, monto: 50 },
			}),
		],
		"confidence boundary 0.7": [
			tx({ confidence: 0.7 }),
			tx({ confidence: 0.69 }),
			tx({ confidence: 0 }),
		],
		"float accumulation": Array.from({ length: 10 }, () =>
			tx({ base: 0.1, igv: 0.1 }),
		),
	};

	for (const [name, list] of Object.entries(sets)) {
		it(`pins computeSummary: ${name}`, () => {
			expect(FiscalSummaryService.computeSummary(list)).toMatchSnapshot();
		});
	}

	const summary = (o: Partial<FiscalPeriodSummary>): FiscalPeriodSummary =>
		({
			companyRuc: "20123456786",
			periodo: "2026-07",
			pendingReview: 0,
			detraccionesPendientes: 0,
			igvAPagar: 0,
			igvAFavor: 0,
			...o,
		}) as FiscalPeriodSummary;

	const healthCases: Array<[string, Partial<FiscalPeriodSummary>, number?]> = [
		["clean, no igv", {}],
		["igv a pagar", { igvAPagar: 1 }],
		["igv a favor", { igvAFavor: 1 }],
		["pending 3", { pendingReview: 3 }],
		["pending 8 floors at 0", { pendingReview: 8 }],
		["pending 10 (info alert)", { pendingReview: 10 }],
		["pending 11 (warning alert)", { pendingReview: 11 }],
		["detracciones 99", { detraccionesPendientes: 99 }],
		["detracciones 1000 (no alert)", { detraccionesPendientes: 1000 }],
		["detracciones 1000.01 (critical)", { detraccionesPendientes: 1000.01 }],
		["detracciones 2500 floors timeliness", { detraccionesPendientes: 2500 }],
		["everything bad", { pendingReview: 20, detraccionesPendientes: 5000 }, 9],
		["anomalies 2", {}, 2],
		["anomalies 6 floors at 0", {}, 6],
	];
	for (const [name, over, anomalies] of healthCases) {
		it(`pins computeHealthScore: ${name}`, () => {
			expect(
				FiscalSummaryService.computeHealthScore(summary(over), anomalies),
			).toMatchSnapshot();
		});
	}
});
