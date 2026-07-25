import { describe, expect, it } from "vitest";
import { formatAsJson, formatAsText } from "../src/evidence-formatter";
import type { QueryResult } from "../src/types";

const sampleResult: QueryResult = {
	tipo: "igv-consulta",
	ruc: "20123456789",
	periodo: "2026-07",
	resultado: { monto: 18234.5, moneda: "PEN" },
	confianza: 0.92,
	fuentes: [
		{
			tipo: "factura-compra",
			serie: "F001",
			numero: 123,
			monto: 450,
			moneda: "PEN",
			cdrHash: "abc123",
			fecha: "2026-07-05",
			confianza: 1.0,
		},
		{
			tipo: "factura-compra",
			serie: "F001",
			numero: 124,
			monto: 1200,
			moneda: "PEN",
			cdrHash: "def456",
			fecha: "2026-07-12",
			confianza: 1.0,
		},
	],
	evidenceArtifacts: [
		{
			id: "evt-001",
			kind: "PHASE_OUTPUT",
			phase: "analysis",
			hash: "0xabc123def456",
		},
	],
};

describe("evidence-formatter", () => {
	describe("formatAsText", () => {
		it("includes RUC and period", () => {
			const text = formatAsText(sampleResult);
			expect(text).toContain("20123456789");
			expect(text).toContain("2026-07");
		});

		it("includes monto with formatting", () => {
			const text = formatAsText(sampleResult);
			expect(text).toContain("18,234.50");
		});

		it("includes confidence", () => {
			const text = formatAsText(sampleResult);
			expect(text).toContain("92%");
		});

		it("includes evidence sources", () => {
			const text = formatAsText(sampleResult);
			expect(text).toContain("F001-123");
			expect(text).toContain("F001-124");
			expect(text).toContain("CDR ✓");
		});

		it("includes evidence hash", () => {
			const text = formatAsText(sampleResult);
			expect(text).toContain("0xabc123def456");
		});

		it("shows error message when present", () => {
			const errorResult: QueryResult = {
				...sampleResult,
				error: "No hay suficiente evidencia",
				sugerencia: "Ejecutá el pipeline de compliance",
			};
			const text = formatAsText(errorResult);
			expect(text).toContain("No hay suficiente evidencia");
			expect(text).toContain("Ejecutá el pipeline de compliance");
		});
	});

	describe("formatAsJson", () => {
		it("produces valid JSON", () => {
			const json = formatAsJson(sampleResult);
			const parsed = JSON.parse(json);
			expect(parsed.tipo).toBe("igv-consulta");
			expect(parsed.confianza).toBe(0.92);
		});

		it("includes evidence refs", () => {
			const json = formatAsJson(sampleResult);
			const parsed = JSON.parse(json);
			expect(parsed.evidenceArtifacts).toHaveLength(1);
		});
	});
});
