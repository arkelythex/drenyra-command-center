import { describe, expect, it } from "bun:test";
import { ShadowSunatEngine } from "../ShadowSunatEngine";
import type { TaxData } from "../types/shadow-sunat";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function createTaxData(overrides: Partial<TaxData> = {}): TaxData {
	return {
		organizationId: "org-1",
		fiscalYear: 2025,
		period: "2025-01",
		ciiu: "4711",
		debitoFiscal: 100000,
		creditoFiscal: 50000,
		proveedoresNoHabidos: 0,
		ingresosBrutos: 500000,
		gastosRepresentacion: 1000,
		gastosSinBancarizar: 0,
		inventarioReal: 100000,
		inventarioTeoricoFinal: 95000,
		margenBruto: 35,
		margenBrutoSector: 30,
		aniosConPerdida: 0,
		detraccionesPendientes: 0,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — singleton", () => {
	it("getInstance() returns the same reference", () => {
		const a = ShadowSunatEngine.getInstance();
		const b = ShadowSunatEngine.getInstance();
		expect(a).toBe(b);
	});
});

// ---------------------------------------------------------------------------
// runPreAudit — clean data
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — clean data (no alerts)", () => {
	it("returns LOW risk and NONE expected action", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const cleanData = createTaxData();
		const result = await engine.runPreAudit(cleanData);

		expect(result.riskLevel).toBe("LOW");
		expect(result.expectedAction).toBe("NONE");
		expect(result.overallRiskScore).toBe(5); // base 5%
		expect(result.auditProbability).toBe(0.05);
	});

	it("returns empty alerts and recommendations", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(createTaxData());

		expect(result.alerts).toHaveLength(0);
		expect(result.recommendations).toHaveLength(0);
	});

	it("returns correct metadata fields", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			organizationId: "org-abc",
			fiscalYear: 2026,
			period: "2026-02",
		});
		const result = await engine.runPreAudit(data);

		expect(result.organizationId).toBe("org-abc");
		expect(result.fiscalYear).toBe(2026);
		expect(result.period).toBe("2026-02");
		expect(result.id).toMatch(/^AUDIT-/);
		expect(result.analysisDate).toBeInstanceOf(Date);
	});

	it("returns sector benchmark with company comparison", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({ ciiu: "6201", margenBruto: 55 });
		const result = await engine.runPreAudit(data);

		expect(result.sectorBenchmark.sectorCode).toBe("6201");
		expect(result.sectorBenchmark.sectorName).toBe("Desarrollo de software");
		expect(result.sectorBenchmark.marginBruteSector).toBe(60);
		expect(result.sectorBenchmark.marginBruteCompany).toBe(55);
		expect(result.sectorBenchmark.marginDeviation).toBe(-5);
	});
});

// ---------------------------------------------------------------------------
// runPreAudit — IGV-001 triggered
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — IGV-001 triggered", () => {
	it("produces an alert in IGV_CREDITO_FISCAL area", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000, // ratio 0.95 → triggers IGV-001
		});
		const result = await engine.runPreAudit(data);

		expect(result.alerts.length).toBeGreaterThan(0);
		const igvAlert = result.alerts.find((a) => a.id === "IGV-001");
		expect(igvAlert).toBeDefined();
		expect(igvAlert!.area).toBe("IGV_CREDITO_FISCAL");
		expect(igvAlert!.severity).toBe("CRITICAL");
	});

	it("returns riskScore > 0 and MEDIUM risk level", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000,
		});
		const result = await engine.runPreAudit(data);

		expect(result.overallRiskScore).toBeGreaterThan(0);
		expect(result.riskLevel).toBe("MEDIUM"); // score 30
	});

	it("returns REQUERIMIENTO expected action", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000,
		});
		const result = await engine.runPreAudit(data);

		// probability = 0.05 + 0.25 = 0.30 → 0.25 <= 0.30 < 0.5 → REQUERIMIENTO
		expect(result.expectedAction).toBe("REQUERIMIENTO");
	});
});

// ---------------------------------------------------------------------------
// runPreAudit — moderate alerts
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — moderate alerts", () => {
	it("returns CARTA_INDUCTIVA when only RENTA-001 (0.15 impact) triggers", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			ingresosBrutos: 50000,
			gastosRepresentacion: 1000, // 0.02 > 0.005 → triggers RENTA-001
		});
		const result = await engine.runPreAudit(data);

		// probability = 0.05 + 0.15 = 0.20 → < 0.25 → CARTA_INDUCTIVA
		expect(result.expectedAction).toBe("CARTA_INDUCTIVA");
		expect(result.riskLevel).toBe("LOW"); // score 20 < 25
	});

	it("returns REQUERIMIENTO when moderate combination triggers", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000, // IGV-001: 0.25
			ingresosBrutos: 50000,
			gastosRepresentacion: 1000, // RENTA-001: 0.15
		});
		const result = await engine.runPreAudit(data);

		// probability = 0.05 + 0.25 + 0.15 = 0.45 → 0.25 <= 0.45 < 0.5 → REQUERIMIENTO
		expect(result.expectedAction).toBe("REQUERIMIENTO");
	});
});

// ---------------------------------------------------------------------------
// runPreAudit — all rules triggered
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — all rules triggered", () => {
	const allTriggeredData: TaxData = createTaxData({
		debitoFiscal: 100000,
		creditoFiscal: 95000, // IGV-001: ratio 0.95 > 0.9
		proveedoresNoHabidos: 3, // IGV-002
		ingresosBrutos: 50000,
		gastosRepresentacion: 3000, // RENTA-001: 0.06 > 0.005
		gastosSinBancarizar: 300000, // RENTA-002: > 200000
		inventarioReal: 100000,
		inventarioTeoricoFinal: 50000, // INV-001: 50% diff > 10%
		margenBruto: -5, // RATIO-001 (below 50% of 30=15) AND RATIO-003 (negative)
		margenBrutoSector: 30,
		aniosConPerdida: 5, // RATIO-002: >= 3
		detraccionesPendientes: 2, // DETR-001
	});

	it("returns CRITICAL risk level", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(allTriggeredData);
		expect(result.riskLevel).toBe("CRITICAL");
	});

	it("returns FISCALIZACION_DEFINITIVA as expected action", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(allTriggeredData);
		expect(result.expectedAction).toBe("FISCALIZACION_DEFINITIVA");
	});

	it("overall risk score is capped at 95", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(allTriggeredData);
		expect(result.overallRiskScore).toBeLessThanOrEqual(95);
		expect(result.overallRiskScore).toBe(95); // auditProbability capped at 0.95
	});

	it("returns non-empty recommendations", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(allTriggeredData);
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("returns alerts for all triggered rules", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(allTriggeredData);
		expect(result.alerts.length).toBe(9); // all 9 rules trigger

		const alertIds = result.alerts.map((a) => a.id);
		expect(alertIds).toContain("IGV-001");
		expect(alertIds).toContain("IGV-002");
		expect(alertIds).toContain("RENTA-001");
		expect(alertIds).toContain("RENTA-002");
		expect(alertIds).toContain("INV-001");
		expect(alertIds).toContain("RATIO-001");
		expect(alertIds).toContain("RATIO-002");
		expect(alertIds).toContain("RATIO-003");
		expect(alertIds).toContain("DETR-001");
	});
});

// ---------------------------------------------------------------------------
// Area risk calculations
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — area risk calculations", () => {
	it("area risks are sorted by score descending (highest risk first)", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000, // IGV-001 → IGV area
			proveedoresNoHabidos: 2, // IGV-002 → IGV area
			detraccionesPendientes: 1, // DETR-001 → detracciones area
			gastosSinBancarizar: 300000, // RENTA-002 → bancarizacion area
		});
		const result = await engine.runPreAudit(data);

		const scores = result.areaRisks.map((a) => a.riskScore);
		for (let i = 1; i < scores.length; i++) {
			expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
		}
	});

	it("area with no alerts has riskScore 0 and LOW riskLevel", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(createTaxData());

		for (const area of result.areaRisks) {
			expect(area.riskScore).toBe(0);
			expect(area.riskLevel).toBe("LOW");
		}
	});

	it("area with alerts has findings listed", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000, // IGV-001
		});
		const result = await engine.runPreAudit(data);

		const igvArea = result.areaRisks.find(
			(a) => a.area === "IGV_CREDITO_FISCAL",
		);
		expect(igvArea).toBeDefined();
		expect(igvArea!.findings.length).toBeGreaterThan(0);
	});

	it("returns metrics with suspicious flags", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000, // triggers IGV-001 → credit ratio metric
		});
		const result = await engine.runPreAudit(data);

		const igvArea = result.areaRisks.find(
			(a) => a.area === "IGV_CREDITO_FISCAL",
		)!;
		const creditMetric = igvArea.metrics.find(
			(m) => m.name === "Ratio Crédito/Débito",
		);
		expect(creditMetric).toBeDefined();
		expect(creditMetric!.value).toBe(95); // 95%
		expect(creditMetric!.threshold).toBe(90);
		expect(creditMetric!.isSuspicious).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Sector benchmarks
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — sector benchmarks", () => {
	it("includes sector name from benchmark data", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(createTaxData({ ciiu: "5610" }));
		expect(result.sectorBenchmark.sectorName).toBe("Restaurantes");
	});

	it("correctly compares company vs sector margins", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(
			createTaxData({ ciiu: "5610", margenBruto: 35, margenBrutoSector: 40 }),
		);

		expect(result.sectorBenchmark.marginBruteSector).toBe(40);
		expect(result.sectorBenchmark.marginBruteCompany).toBe(35);
		expect(result.sectorBenchmark.marginDeviation).toBe(-5);
	});

	it("includes percentile position", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(
			createTaxData({ margenBruto: 30, margenBrutoSector: 25 }),
		);
		// 30/25*50 = 60, capped at 100
		expect(result.sectorBenchmark.percentilePosition).toBe(60);
	});

	it("handles unknown CIIU with default benchmark", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const result = await engine.runPreAudit(createTaxData({ ciiu: "9999" }));
		expect(result.sectorBenchmark.sectorName).toBe("Sector no clasificado");
		expect(result.sectorBenchmark.marginBruteSector).toBe(20);
	});
});

// ---------------------------------------------------------------------------
// generateExplanation
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — generateExplanation", () => {
	it("returns a markdown string with risk level, score, alerts, and recommendations", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000,
			detraccionesPendientes: 1,
		});
		const result = await engine.runPreAudit(data);
		const explanation = engine.generateExplanation(result);

		expect(typeof explanation).toBe("string");
		// Contains key sections
		expect(explanation).toContain("Análisis Pre-Auditoría");
		expect(explanation).toContain(result.riskLevel);
		expect(explanation).toContain(String(result.overallRiskScore));
		expect(explanation).toContain("Alertas Detectadas");
		expect(explanation).toContain("Recomendaciones");
	});

	it("mentions alert descriptions in explanation", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000,
		});
		const result = await engine.runPreAudit(data);
		const explanation = engine.generateExplanation(result);

		// The explanation includes alert title and description, not the rule ID
		expect(explanation).toContain("Ratio crédito/débito anómalo");
		expect(explanation).toContain(
			"El crédito fiscal excede el 90% del débito fiscal",
		);
	});

	it("includes correct expected action label in explanation", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000,
		});
		const result = await engine.runPreAudit(data);
		const explanation = engine.generateExplanation(result);

		expect(explanation).toContain("Requerimiento de Información");
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("ShadowSunatEngine — edge cases", () => {
	it("overall risk score never exceeds 95", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 100000,
			creditoFiscal: 95000,
			proveedoresNoHabidos: 5,
			ingresosBrutos: 1000,
			gastosRepresentacion: 500,
			gastosSinBancarizar: 500000,
			inventarioReal: 100000,
			inventarioTeoricoFinal: 10000,
			margenBruto: -10,
			margenBrutoSector: 30,
			aniosConPerdida: 5,
			detraccionesPendientes: 10,
		});
		const result = await engine.runPreAudit(data);
		expect(result.overallRiskScore).toBeLessThanOrEqual(95);
	});

	it("handles zero values gracefully (no division errors)", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 0,
			creditoFiscal: 0,
			ingresosBrutos: 0,
			inventarioReal: 0,
			margenBruto: 0,
			margenBrutoSector: 0,
		});
		const result = await engine.runPreAudit(data);
		// Should not throw — should return a valid result
		expect(result.riskLevel).toBe("LOW");
		expect(result.expectedAction).toBe("NONE");
	});

	it("recommendations are not empty when alerts exist", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			detraccionesPendientes: 1,
		});
		const result = await engine.runPreAudit(data);

		expect(result.alerts.length).toBeGreaterThan(0);
		expect(result.recommendations.length).toBeGreaterThan(0);

		// DETR-001 should have a recommendation
		const detraRec = result.recommendations.find(
			(r) => r.alertId === "DETR-001",
		);
		expect(detraRec).toBeDefined();
		expect(detraRec!.action).toContain("Depositar detracciones");
	});

	it("returns correct credit ratio metrics in IGV area", async () => {
		const engine = ShadowSunatEngine.getInstance();
		const data = createTaxData({
			debitoFiscal: 200000,
			creditoFiscal: 190000, // 95% ratio
		});
		const result = await engine.runPreAudit(data);

		const igvArea = result.areaRisks.find(
			(a) => a.area === "IGV_CREDITO_FISCAL",
		)!;
		const metric = igvArea.metrics.find(
			(m) => m.name === "Ratio Crédito/Débito",
		)!;
		expect(metric.value).toBe(95);
		expect(metric.sectorAverage).toBe(70);
		expect(metric.deviation).toBe(25);
	});
});
