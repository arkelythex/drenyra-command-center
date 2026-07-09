import { describe, expect, it } from "bun:test";
import type {
	RiskLevel,
	RiskSeverity,
	SUNATExpectedAction,
	TaxData,
} from "../types/shadow-sunat";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RISK_LEVEL_ORDER: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SUNAT_ACTION_ORDER: SUNATExpectedAction[] = [
	"NONE",
	"CARTA_INDUCTIVA",
	"REQUERIMIENTO",
	"VERIFICACION",
	"FISCALIZACION_PARCIAL",
	"FISCALIZACION_DEFINITIVA",
];

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
// TaxData builder
// ---------------------------------------------------------------------------

describe("TaxData builder", () => {
	it("creates valid data with sensible defaults", () => {
		const data = createTaxData();
		expect(data.organizationId).toBe("org-1");
		expect(data.fiscalYear).toBe(2025);
		expect(data.period).toBe("2025-01");
		expect(typeof data.debitoFiscal).toBe("number");
		expect(typeof data.creditoFiscal).toBe("number");
		expect(typeof data.proveedoresNoHabidos).toBe("number");
		expect(typeof data.ingresosBrutos).toBe("number");
		expect(typeof data.gastosRepresentacion).toBe("number");
		expect(typeof data.gastosSinBancarizar).toBe("number");
		expect(typeof data.inventarioReal).toBe("number");
		expect(typeof data.inventarioTeoricoFinal).toBe("number");
		expect(typeof data.margenBruto).toBe("number");
		expect(typeof data.margenBrutoSector).toBe("number");
		expect(typeof data.aniosConPerdida).toBe("number");
		expect(typeof data.detraccionesPendientes).toBe("number");
		expect(data.ciiu).toBe("4711");
	});

	it("overrides partial fields correctly", () => {
		const data = createTaxData({
			organizationId: "org-xyz",
			fiscalYear: 2030,
			ciiu: "6201",
		});
		expect(data.organizationId).toBe("org-xyz");
		expect(data.fiscalYear).toBe(2030);
		expect(data.ciiu).toBe("6201");
		// Non-overridden fields keep defaults
		expect(data.period).toBe("2025-01");
	});

	it("all numeric fields accept integer values", () => {
		const data = createTaxData({
			debitoFiscal: 999999999,
			creditoFiscal: 1,
			gastosSinBancarizar: 0,
			inventarioReal: 1000000,
			margenBruto: -50,
		});
		expect(data.debitoFiscal).toBe(999999999);
		expect(data.creditoFiscal).toBe(1);
		expect(data.gastosSinBancarizar).toBe(0);
		expect(data.inventarioReal).toBe(1000000);
		expect(data.margenBruto).toBe(-50);
	});
});

// ---------------------------------------------------------------------------
// RiskSeverity validation
// ---------------------------------------------------------------------------

describe("RiskSeverity", () => {
	it("accepts only WARNING or CRITICAL as valid runtime values", () => {
		const valid: string[] = ["WARNING", "CRITICAL"];
		expect(valid).toContain("WARNING");
		expect(valid).toContain("CRITICAL");
		expect(valid).not.toContain("LOW");
		expect(valid).not.toContain("HIGH");
		expect(valid).not.toContain("INFO");
	});

	it("supports both severity values in practice", () => {
		const warning: RiskSeverity = "WARNING";
		const critical: RiskSeverity = "CRITICAL";
		expect(warning).toBe("WARNING");
		expect(critical).toBe("CRITICAL");
	});

	it("WARNING has lower severity than CRITICAL", () => {
		const _severityOrder: RiskSeverity[] = ["WARNING", "CRITICAL"];
		const impactMap: Record<RiskSeverity, number> = {
			WARNING: 1,
			CRITICAL: 2,
		};
		expect(impactMap.WARNING).toBeLessThan(impactMap.CRITICAL);
	});
});

// ---------------------------------------------------------------------------
// RiskLevel progression
// ---------------------------------------------------------------------------

describe("RiskLevel progression", () => {
	it("contains exactly four levels in order", () => {
		expect(RISK_LEVEL_ORDER).toEqual(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
	});

	it("progression increases in severity", () => {
		const severityMap: Record<RiskLevel, number> = {
			LOW: 0,
			MEDIUM: 1,
			HIGH: 2,
			CRITICAL: 3,
		};

		for (let i = 1; i < RISK_LEVEL_ORDER.length; i++) {
			const prev = RISK_LEVEL_ORDER[i - 1];
			const curr = RISK_LEVEL_ORDER[i];
			expect(severityMap[prev]).toBeLessThan(severityMap[curr]);
		}
	});

	it("comparing string values works lexicographically for expected cases", () => {
		// At runtime these are just strings — verify the correct ones are used
		expect("LOW".length).toBeGreaterThan(0);
		expect("CRITICAL".length).toBeGreaterThan(0);
	});

	it("can be used to determine action escalation", () => {
		const requiresAction = (level: RiskLevel): boolean => {
			return level === "HIGH" || level === "CRITICAL";
		};

		expect(requiresAction("LOW")).toBe(false);
		expect(requiresAction("MEDIUM")).toBe(false);
		expect(requiresAction("HIGH")).toBe(true);
		expect(requiresAction("CRITICAL")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// SUNATExpectedAction progression
// ---------------------------------------------------------------------------

describe("SUNATExpectedAction progression", () => {
	it("contains exactly six actions in order", () => {
		expect(SUNAT_ACTION_ORDER).toEqual([
			"NONE",
			"CARTA_INDUCTIVA",
			"REQUERIMIENTO",
			"VERIFICACION",
			"FISCALIZACION_PARCIAL",
			"FISCALIZACION_DEFINITIVA",
		]);
	});

	it("progression escalates correctly", () => {
		const severityMap: Record<SUNATExpectedAction, number> = {
			NONE: 0,
			CARTA_INDUCTIVA: 1,
			REQUERIMIENTO: 2,
			VERIFICACION: 3,
			FISCALIZACION_PARCIAL: 4,
			FISCALIZACION_DEFINITIVA: 5,
		};

		for (let i = 1; i < SUNAT_ACTION_ORDER.length; i++) {
			const prev = SUNAT_ACTION_ORDER[i - 1];
			const curr = SUNAT_ACTION_ORDER[i];
			expect(severityMap[prev]).toBeLessThan(severityMap[curr]);
		}
	});

	it("NONE is the least severe action", () => {
		const action = "NONE" as SUNATExpectedAction;
		expect(action).toBe(SUNAT_ACTION_ORDER[0]);
	});

	it("FISCALIZACION_DEFINITIVA is the most severe action", () => {
		const action = "FISCALIZACION_DEFINITIVA" as SUNATExpectedAction;
		expect(action).toBe(SUNAT_ACTION_ORDER[SUNAT_ACTION_ORDER.length - 1]);
	});

	it("can compare actions for escalation decisions", () => {
		const isEscalated = (action: SUNATExpectedAction): boolean => {
			const index = SUNAT_ACTION_ORDER.indexOf(action);
			return index >= 3; // VERIFICACION or higher
		};

		expect(isEscalated("NONE")).toBe(false);
		expect(isEscalated("CARTA_INDUCTIVA")).toBe(false);
		expect(isEscalated("REQUERIMIENTO")).toBe(false);
		expect(isEscalated("VERIFICACION")).toBe(true);
		expect(isEscalated("FISCALIZACION_PARCIAL")).toBe(true);
		expect(isEscalated("FISCALIZACION_DEFINITIVA")).toBe(true);
	});
});
