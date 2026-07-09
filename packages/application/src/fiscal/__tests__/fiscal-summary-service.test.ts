import type { FiscalTransaction } from "@drenyra/domain/fiscal";
import { describe, expect, it } from "vitest";
import { FiscalSummaryService } from "../fiscal-summary-service";

function makeTx(overrides: Partial<FiscalTransaction>): FiscalTransaction {
	return {
		id: "tx-001",
		companyRuc: "20123456786",
		companyId: "comp-1",
		fechaEmision: "2026-07-01",
		fechaContable: "2026-07-01",
		tipoComprobante: "01",
		serie: "F001",
		numero: "1",
		rucContraparte: "20123456786",
		razonSocialContraparte: "Test",
		moneda: "PEN",
		montoOriginal: 118,
		montoPEN: 118,
		classification: {
			igvTreatment: "GRAVADO",
			igvType: "DEBITO_FISCAL",
			igvRate: 18,
			baseImponible: 100,
			igvAmount: 18,
			total: 118,
			moneda: "PEN",
			sireCategory: "VENTAS",
			sireDocumentType: "01",
			periodo: "2026-07",
			detraccion: {
				codigo: "",
				porcentaje: 0,
				monto: 0,
				moneda: "PEN",
				aplica: false,
				estado: "EXONERADO",
			},
			percepcion: { aplica: false, porcentaje: 0, monto: 0, agente: "" },
			retencion: { aplica: false, porcentaje: 0, monto: 0, agente: "" },
			confidence: 0.95,
			classificationSource: "DETERMINISTIC",
		},
		metadata: {},
		hash: "abc123",
		createdAt: "2026-07-01T00:00:00Z",
		classifiedBy: "system",
		...overrides,
	};
}

describe("FiscalSummaryService", () => {
	it("computes summary with single sale", () => {
		const summary = FiscalSummaryService.computeSummary([makeTx({})]);

		expect(summary.periodo).toBe("2026-07");
		expect(summary.ventasGravadas).toBe(100);
		expect(summary.igvVentas).toBe(18);
		expect(summary.comprasGravadas).toBe(0);
		expect(summary.igvAPagar).toBe(18);
		expect(summary.igvAFavor).toBe(0);
	});

	it("computes summary with sale and purchase", () => {
		const summary = FiscalSummaryService.computeSummary([
			makeTx({}),
			makeTx({
				id: "tx-002",
				classification: {
					...makeTx({}).classification,
					igvType: "CREDITO_FISCAL",
					sireCategory: "COMPRAS",
				},
			}),
		]);

		expect(summary.igvVentas).toBe(18);
		expect(summary.igvCompras).toBe(18);
		expect(summary.igvAPagar).toBe(0);
		expect(summary.igvAFavor).toBe(0);
	});

	it("tracks pending review count", () => {
		const summary = FiscalSummaryService.computeSummary([
			makeTx({}),
			makeTx({
				id: "tx-low-conf",
				classification: {
					...makeTx({}).classification,
					confidence: 0.3,
				},
			}),
		]);

		expect(summary.pendingReview).toBe(1);
	});

	it("computes health score with no issues", () => {
		const summary = FiscalSummaryService.computeSummary([makeTx({})]);
		const health = FiscalSummaryService.computeHealthScore(summary, 0);

		expect(health.overall).toBeGreaterThanOrEqual(90);
		expect(health.components.sireReproducibility).toBe(40);
		expect(health.components.anomaliesScore).toBe(30);
		expect(health.alerts.length).toBe(0);
	});

	it("generates alerts for high pending review", () => {
		const txs = Array.from({ length: 15 }, (_, i) =>
			makeTx({
				id: `tx-${i}`,
				classification: {
					...makeTx({}).classification,
					confidence: 0.3,
				},
			}),
		);
		const summary = FiscalSummaryService.computeSummary(txs);
		const health = FiscalSummaryService.computeHealthScore(summary, 0);

		expect(health.alerts.length).toBeGreaterThanOrEqual(1);
		expect(health.alerts.some((a) => a.severity === "WARNING")).toBe(true);
	});

	it("computes health score with detracción warning", () => {
		const summary = FiscalSummaryService.computeSummary([
			makeTx({
				classification: {
					...makeTx({}).classification,
					detraccion: {
						codigo: "013",
						porcentaje: 4,
						monto: 1500,
						moneda: "PEN",
						aplica: true,
						estado: "PENDIENTE",
					},
				},
			}),
		]);
		const health = FiscalSummaryService.computeHealthScore(summary, 0);

		expect(health.alerts.some((a) => a.severity === "CRITICAL")).toBe(true);
	});
});
