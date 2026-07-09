import { describe, it, expect } from "vitest";
import { routeIntent } from "../src/pipeline-router";

describe("pipeline-router", () => {
	it("routes IGV consulta to fiscal pipeline", () => {
		const route = routeIntent({
			kind: "igv-consulta",
			confidence: 0.9,
			extracted: { ruc: "20123456789", periodo: "2026-07", keywords: ["igv"] },
		});
		expect(route.requiresPipeline).toBe(true);
		expect(route.pipelineId).toBe("fiscal-igv-consulta");
		expect(route.isDirectLookup).toBe(false);
	});

	it("routes detracciones consulta to fiscal pipeline", () => {
		const route = routeIntent({
			kind: "detracciones-consulta",
			confidence: 0.85,
			extracted: { periodo: "2026-07", keywords: ["detraccion"] },
		});
		expect(route.requiresPipeline).toBe(true);
		expect(route.pipelineId).toContain("detracciones");
	});

	it("routes sire-resumen to fiscal pipeline", () => {
		const route = routeIntent({
			kind: "sire-resumen",
			confidence: 0.8,
			extracted: { periodo: "2026-07", keywords: ["sire"] },
		});
		expect(route.requiresPipeline).toBe(true);
	});

	it("routes pipeline-run to full SDD", () => {
		const route = routeIntent({
			kind: "pipeline-run",
			confidence: 0.85,
			extracted: { ruc: "20123456789", keywords: ["analiza"] },
		});
		expect(route.requiresPipeline).toBe(true);
		expect(route.pipelineId).toBe("fiscal-full-sdd");
	});

	it("routes factura-lookup as direct", () => {
		const route = routeIntent({
			kind: "factura-lookup",
			confidence: 0.9,
			extracted: { keywords: ["factura"] },
		});
		expect(route.requiresPipeline).toBe(false);
		expect(route.isDirectLookup).toBe(true);
	});

	it("routes unknown without pipeline", () => {
		const route = routeIntent({
			kind: "unknown",
			confidence: 0,
			extracted: { keywords: [] },
		});
		expect(route.requiresPipeline).toBe(false);
		expect(route.isDirectLookup).toBe(false);
	});
});
