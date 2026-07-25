import { describe, expect, it } from "vitest";
import {
	buildClarification,
	extractPeriodo,
	extractRuc,
	matchIntentPatterns,
} from "../src/intent-registry";

describe("intent-registry", () => {
	describe("extractRuc", () => {
		it("extracts RUC from text", () => {
			expect(extractRuc("IGV para RUC 20123456789")).toBe("20123456789");
		});

		it("extracts RUC with surrounding text", () => {
			expect(extractRuc("ruc: 20123456789 periodo julio 2026")).toBe(
				"20123456789",
			);
		});

		it("returns undefined for no RUC", () => {
			expect(extractRuc("IGV de julio 2026")).toBeUndefined();
		});

		it("does not match non-11-digit numbers", () => {
			expect(extractRuc("factura F001-123")).toBeUndefined();
		});
	});

	describe("extractPeriodo", () => {
		it("extracts YYYY-MM format", () => {
			expect(extractPeriodo("IGV 2026-07")).toBe("2026-07");
		});

		it("extracts MM/YYYY format", () => {
			expect(extractPeriodo("IGV 07/2026")).toBe("2026-07");
		});

		it('extracts "julio 2026" style', () => {
			expect(extractPeriodo("IGV de julio 2026")).toBe("2026-07");
		});

		it('extracts "último mes"', () => {
			const result = extractPeriodo("IGV del último mes");
			expect(result).toBeDefined();
			expect(result).toMatch(/^\d{4}-\d{2}$/);
		});

		it("returns undefined for no period", () => {
			expect(extractPeriodo("dame el IGV")).toBeUndefined();
		});
	});

	describe("matchIntentPatterns", () => {
		it("classifies IGV query with high confidence", () => {
			const result = matchIntentPatterns(
				"IGV de julio 2026 para RUC 20123456789",
			);
			expect(result.kind).toBe("igv-consulta");
			expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			expect(result.extracted.ruc).toBe("20123456789");
			expect(result.extracted.periodo).toBe("2026-07");
		});

		it("classifies detracciones query", () => {
			const result = matchIntentPatterns(
				"detracciones pendientes RUC 20123456789",
			);
			expect(result.kind).toBe("detracciones-consulta");
			expect(result.confidence).toBeGreaterThanOrEqual(0.4);
		});

		it("classifies SIRE query", () => {
			const result = matchIntentPatterns("resumen SIRE julio 2026");
			expect(result.kind).toBe("sire-resumen");
		});

		it("classifies pipeline-run query", () => {
			const result = matchIntentPatterns(
				"analizame este período RUC 20123456789",
			);
			expect(result.kind).toBe("pipeline-run");
		});

		it("classifies factura lookup", () => {
			const result = matchIntentPatterns("dame la factura F001-123");
			expect(result.kind).toBe("factura-lookup");
		});

		it("returns unknown for unmatched query", () => {
			const result = matchIntentPatterns("hola mundo");
			expect(result.kind).toBe("unknown");
			expect(result.confidence).toBe(0);
		});

		it("gives confidence bonus with RUC + periodo", () => {
			const withEntities = matchIntentPatterns(
				"IGV de julio 2026 para RUC 20123456789",
			);
			const withoutEntities = matchIntentPatterns("IGV");
			expect(withEntities.confidence).toBeGreaterThan(
				withoutEntities.confidence,
			);
		});
	});

	describe("buildClarification", () => {
		it("suggests RUC when missing", () => {
			const suggestions = buildClarification({});
			expect(suggestions.some((s) => s.includes("RUC"))).toBe(true);
		});

		it("suggests period when missing", () => {
			const suggestions = buildClarification({ ruc: "20123456789" });
			expect(suggestions.some((s) => s.includes("período"))).toBe(true);
		});

		it("returns empty when both present", () => {
			const suggestions = buildClarification({
				ruc: "20123456789",
				periodo: "2026-07",
			});
			expect(suggestions).toHaveLength(0);
		});
	});
});
