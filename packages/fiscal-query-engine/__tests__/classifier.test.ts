import { describe, it, expect } from "vitest";
import { classifyQuery } from "../src/classifier";

describe("classifier", () => {
	it("classifies high-confidence IGV query", async () => {
		const result = await classifyQuery({
			texto: "IGV de julio 2026 para RUC 20123456789",
		});
		expect(result.kind).toBe("igv-consulta");
		expect(result.confidence).toBeGreaterThanOrEqual(0.7);
	});

	it("returns suggestions for ambiguous query", async () => {
		const result = await classifyQuery({
			texto: "dame el IGV",
		});
		expect(result.confidence).toBeLessThan(0.7);
		expect(result.suggestions).toBeDefined();
		expect(result.suggestions?.length).toBeGreaterThan(0);
	});

	it("returns unknown for irrelevant query", async () => {
		const result = await classifyQuery({
			texto: "hola mundo",
		});
		expect(result.kind).toBe("unknown");
		expect(result.confidence).toBe(0);
	});

	it("accepts custom pattern threshold", async () => {
		const result = await classifyQuery(
			{ texto: "igv" },
			{ patternThreshold: 0.3 },
		);
		// With threshold 0.3, "igv" alone should pass
		expect(result.kind).toBe("igv-consulta");
	});
});
