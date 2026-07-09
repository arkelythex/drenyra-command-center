import { describe, expect, it } from "bun:test";
import {
	generateRecommendations,
	getSectorBenchmark,
	SECTOR_BENCHMARKS,
	SUNAT_RISK_RULES,
} from "../ShadowSunatRules";
import type { TaxData } from "../types/shadow-sunat";

// ---------------------------------------------------------------------------
// Helpers
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
// Rule structure tests
// ---------------------------------------------------------------------------

describe("SUNAT_RISK_RULES", () => {
	const expectedRuleIds = [
		"IGV-001",
		"IGV-002",
		"RENTA-001",
		"RENTA-002",
		"INV-001",
		"RATIO-001",
		"RATIO-002",
		"RATIO-003",
		"DETR-001",
	];

	it("contains all expected rules", () => {
		const ids = SUNAT_RISK_RULES.map((r) => r.id);
		for (const id of expectedRuleIds) {
			expect(ids).toContain(id);
		}
		expect(SUNAT_RISK_RULES.length).toBe(expectedRuleIds.length);
	});

	it("every rule has all required fields", () => {
		for (const rule of SUNAT_RISK_RULES) {
			expect(rule.id).toBeTruthy();
			expect(rule.area).toBeTruthy();
			expect(rule.name).toBeTruthy();
			expect(rule.description).toBeTruthy();
			expect(rule.condition).toBeInstanceOf(Function);
			expect(["WARNING", "CRITICAL"]).toContain(rule.severity);
			expect(rule.auditImpact).toBeGreaterThan(0);
			expect(rule.auditImpact).toBeLessThanOrEqual(1);
			expect(rule.legalBasis).toBeTruthy();
		}
	});

	it("each rule has a unique id", () => {
		const ids = SUNAT_RISK_RULES.map((r) => r.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

// ---------------------------------------------------------------------------
// Rule conditions — positive tests (should trigger)
// ---------------------------------------------------------------------------

describe("Rule conditions — triggered", () => {
	it("IGV-001 triggers when credit/debit ratio > 0.9", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "IGV-001")!;
		const data = createTaxData({ debitoFiscal: 100000, creditoFiscal: 95000 });
		expect(rule.condition(data)).toBe(true);
	});

	it("IGV-002 triggers when proveedoresNoHabidos > 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "IGV-002")!;
		const data = createTaxData({ proveedoresNoHabidos: 3 });
		expect(rule.condition(data)).toBe(true);
	});

	it("RENTA-001 triggers when gastosRepresentacion/ingresosBrutos > 0.005", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RENTA-001")!;
		const data = createTaxData({
			ingresosBrutos: 100000,
			gastosRepresentacion: 3000,
		}); // 0.03 > 0.005
		expect(rule.condition(data)).toBe(true);
	});

	it("RENTA-002 triggers when gastosSinBancarizar > 200000 (S/ 2,000 en céntimos)", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RENTA-002")!;
		const data = createTaxData({ gastosSinBancarizar: 200001 });
		expect(rule.condition(data)).toBe(true);
	});

	it("INV-001 triggers when inventory discrepancy > 10%", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "INV-001")!;
		const data = createTaxData({
			inventarioReal: 100000,
			inventarioTeoricoFinal: 75000,
		}); // 25% diff
		expect(rule.condition(data)).toBe(true);
	});

	it("RATIO-001 triggers when margenBruto < 50% of sector average", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RATIO-001")!;
		const data = createTaxData({ margenBruto: 10, margenBrutoSector: 30 }); // 10 < 15
		expect(rule.condition(data)).toBe(true);
	});

	it("RATIO-002 triggers when aniosConPerdida >= 3", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RATIO-002")!;
		const data = createTaxData({ aniosConPerdida: 3 });
		expect(rule.condition(data)).toBe(true);
	});

	it("RATIO-003 triggers when margenBruto < 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RATIO-003")!;
		const data = createTaxData({ margenBruto: -5 });
		expect(rule.condition(data)).toBe(true);
	});

	it("DETR-001 triggers when detraccionesPendientes > 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "DETR-001")!;
		const data = createTaxData({ detraccionesPendientes: 2 });
		expect(rule.condition(data)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Rule conditions — negative tests (should NOT trigger)
// ---------------------------------------------------------------------------

describe("Rule conditions — NOT triggered", () => {
	it("IGV-001 does NOT trigger when credit/debit ratio <= 0.9", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "IGV-001")!;
		const data = createTaxData({ debitoFiscal: 100000, creditoFiscal: 90000 }); // 0.9 exactly
		expect(rule.condition(data)).toBe(false);
	});

	it("IGV-001 does NOT trigger when debitoFiscal is 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "IGV-001")!;
		const data = createTaxData({ debitoFiscal: 0, creditoFiscal: 50000 });
		expect(rule.condition(data)).toBe(false);
	});

	it("RENTA-001 does NOT trigger when ratio <= 0.005", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RENTA-001")!;
		const data = createTaxData({
			ingresosBrutos: 100000,
			gastosRepresentacion: 500,
		}); // 0.005 exactly
		expect(rule.condition(data)).toBe(false);
	});

	it("RENTA-001 does NOT trigger when ingresosBrutos is 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RENTA-001")!;
		const data = createTaxData({
			ingresosBrutos: 0,
			gastosRepresentacion: 1000,
		});
		expect(rule.condition(data)).toBe(false);
	});

	it("RENTA-002 does NOT trigger when gastosSinBancarizar <= 200000", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RENTA-002")!;
		const data = createTaxData({ gastosSinBancarizar: 200000 });
		expect(rule.condition(data)).toBe(false);
	});

	it("INV-001 does NOT trigger when discrepancy <= 10%", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "INV-001")!;
		const data = createTaxData({
			inventarioReal: 100000,
			inventarioTeoricoFinal: 90000,
		}); // 10% exactly
		expect(rule.condition(data)).toBe(false);
	});

	it("INV-001 does NOT trigger when inventarioReal is 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "INV-001")!;
		const data = createTaxData({
			inventarioReal: 0,
			inventarioTeoricoFinal: 50000,
		});
		expect(rule.condition(data)).toBe(false);
	});

	it("RATIO-001 does NOT trigger when margin >= 50% of sector", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RATIO-001")!;
		const data = createTaxData({ margenBruto: 15, margenBrutoSector: 30 }); // 15 >= 15
		expect(rule.condition(data)).toBe(false);
	});

	it("RATIO-001 does NOT trigger when margenBrutoSector is 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RATIO-001")!;
		const data = createTaxData({ margenBruto: 5, margenBrutoSector: 0 });
		expect(rule.condition(data)).toBe(false);
	});

	it("RATIO-002 does NOT trigger when aniosConPerdida < 3", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RATIO-002")!;
		const data = createTaxData({ aniosConPerdida: 2 });
		expect(rule.condition(data)).toBe(false);
	});

	it("RATIO-003 does NOT trigger when margenBruto >= 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "RATIO-003")!;
		const data = createTaxData({ margenBruto: 0 });
		expect(rule.condition(data)).toBe(false);
	});

	it("DETR-001 does NOT trigger when detraccionesPendientes === 0", () => {
		const rule = SUNAT_RISK_RULES.find((r) => r.id === "DETR-001")!;
		const data = createTaxData({ detraccionesPendientes: 0 });
		expect(rule.condition(data)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Sector benchmarks
// ---------------------------------------------------------------------------

describe("getSectorBenchmark", () => {
	it("returns retail benchmark for CIIU 4711", () => {
		const result = getSectorBenchmark("4711");
		expect(result.name).toBe("Comercio minorista");
		expect(result.marginBruto).toBe(25);
		expect(result.creditRatio).toBe(70);
	});

	it("returns software benchmark for CIIU 6201", () => {
		const result = getSectorBenchmark("6201");
		expect(result.name).toBe("Desarrollo de software");
		expect(result.marginBruto).toBe(60);
		expect(result.creditRatio).toBe(40);
	});

	it("returns default for unknown CIIU code", () => {
		const result = getSectorBenchmark("9999");
		expect(result.name).toBe("Sector no clasificado");
		expect(result.marginBruto).toBe(20);
		expect(result.creditRatio).toBe(70);
	});

	it("returns default for empty string", () => {
		const result = getSectorBenchmark("");
		expect(result.name).toBe("Sector no clasificado");
	});

	it("every defined sector has name, marginBruto and creditRatio", () => {
		for (const [code, sector] of Object.entries(SECTOR_BENCHMARKS)) {
			expect(code).toBeTruthy();
			expect(sector.name).toBeTruthy();
			expect(typeof sector.marginBruto).toBe("number");
			expect(typeof sector.creditRatio).toBe("number");
		}
	});
});

// ---------------------------------------------------------------------------
// generateRecommendations
// ---------------------------------------------------------------------------

describe("generateRecommendations", () => {
	it("returns empty array for no alerts", () => {
		const result = generateRecommendations([]);
		expect(result).toEqual([]);
	});

	it("returns recommendations for known alert IDs", () => {
		const alerts = [
			{
				id: "IGV-001",
				area: "IGV_CREDITO_FISCAL" as const,
				severity: "CRITICAL" as const,
				title: "Test",
				description: "Test description",
				legalBasis: "Test basis",
				auditProbabilityImpact: 0.25,
			},
			{
				id: "IGV-002",
				area: "IGV_CREDITO_FISCAL" as const,
				severity: "CRITICAL" as const,
				title: "Test",
				description: "Test description",
				legalBasis: "Test basis",
				auditProbabilityImpact: 0.4,
			},
		];

		const result = generateRecommendations(alerts);
		expect(result).toHaveLength(2);

		const recIgn002 = result.find((r) => r.alertId === "IGV-002");
		expect(recIgn002).toBeDefined();
		expect(recIgn002?.action).toContain("NO HABIDO");
		expect(recIgn002?.priority).toBe("IMMEDIATE");
		expect(recIgn002?.id).toBe("REC-IGV-002");
		expect(recIgn002?.canAutoFix).toBe(true);
		expect(recIgn002?.autoFixAction).toBe("EXCLUDE_NO_HABIDO");
	});

	it("returns IMMEDIATE before BEFORE_DECLARATION before NEXT_PERIOD", () => {
		const alerts = [
			{
				id: "RATIO-002",
				area: "RATIOS_FINANCIEROS" as const,
				severity: "CRITICAL" as const,
				title: "Test",
				description: "Test",
				legalBasis: "Test",
				auditProbabilityImpact: 0.45,
			},
			{
				id: "IGV-001",
				area: "IGV_CREDITO_FISCAL" as const,
				severity: "CRITICAL" as const,
				title: "Test",
				description: "Test",
				legalBasis: "Test",
				auditProbabilityImpact: 0.25,
			},
			{
				id: "IGV-002",
				area: "IGV_CREDITO_FISCAL" as const,
				severity: "CRITICAL" as const,
				title: "Test",
				description: "Test",
				legalBasis: "Test",
				auditProbabilityImpact: 0.4,
			},
		];

		const result = generateRecommendations(alerts);
		const priorities = result.map((r) => r.priority);
		// IMMEDIATE first, BEFORE_DECLARATION second, NEXT_PERIOD last
		const immIdx = priorities.indexOf("IMMEDIATE");
		const bdIdx = priorities.indexOf("BEFORE_DECLARATION");
		const npIdx = priorities.indexOf("NEXT_PERIOD");

		expect(immIdx).toBeLessThan(bdIdx);
		expect(bdIdx).toBeLessThan(npIdx);
	});

	it("ignores unknown alert IDs gracefully", () => {
		const alerts = [
			{
				id: "UNKNOWN-999",
				area: "IGV_CREDITO_FISCAL" as const,
				severity: "CRITICAL" as const,
				title: "Test",
				description: "Test",
				legalBasis: "Test",
				auditProbabilityImpact: 0.5,
			},
		];
		const result = generateRecommendations(alerts);
		expect(result).toEqual([]);
	});
});
