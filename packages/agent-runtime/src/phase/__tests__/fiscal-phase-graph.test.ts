import { describe, expect, it } from "vitest";
import {
	createDefaultPhaseGraph,
	getNextPhase,
	getPreviousPhase,
	isValidTransition,
	PHASE_ORDER,
	validateGraph,
} from "../fiscal-phase-graph";

describe("FiscalPhaseGraph", () => {
	describe("PHASE_ORDER", () => {
		it("has exactly 6 phases in the correct order", () => {
			expect(PHASE_ORDER).toEqual([
				"captura",
				"clasificacion",
				"conciliacion",
				"cierre",
				"declaracion",
				"auditoria",
			]);
		});
	});

	describe("isValidTransition", () => {
		it("allows forward sequential transitions", () => {
			expect(isValidTransition("captura", "clasificacion")).toBe(true);
			expect(isValidTransition("clasificacion", "conciliacion")).toBe(true);
			expect(isValidTransition("conciliacion", "cierre")).toBe(true);
			expect(isValidTransition("cierre", "declaracion")).toBe(true);
			expect(isValidTransition("declaracion", "auditoria")).toBe(true);
		});

		it("rejects backward transitions", () => {
			expect(isValidTransition("clasificacion", "captura")).toBe(false);
			expect(isValidTransition("auditoria", "declaracion")).toBe(false);
		});

		it("rejects skipping phases", () => {
			expect(isValidTransition("captura", "conciliacion")).toBe(false);
			expect(isValidTransition("captura", "cierre")).toBe(false);
			expect(isValidTransition("clasificacion", "declaracion")).toBe(false);
		});

		it("rejects self-transitions", () => {
			expect(isValidTransition("captura", "captura")).toBe(false);
			expect(isValidTransition("auditoria", "auditoria")).toBe(false);
		});
	});

	describe("getNextPhase", () => {
		it("returns the correct next phase for each phase", () => {
			expect(getNextPhase("captura")).toBe("clasificacion");
			expect(getNextPhase("clasificacion")).toBe("conciliacion");
			expect(getNextPhase("conciliacion")).toBe("cierre");
			expect(getNextPhase("cierre")).toBe("declaracion");
			expect(getNextPhase("declaracion")).toBe("auditoria");
		});

		it("returns undefined for the last phase", () => {
			expect(getNextPhase("auditoria")).toBeUndefined();
		});
	});

	describe("getPreviousPhase", () => {
		it("returns the correct previous phase for each phase", () => {
			expect(getPreviousPhase("clasificacion")).toBe("captura");
			expect(getPreviousPhase("conciliacion")).toBe("clasificacion");
			expect(getPreviousPhase("cierre")).toBe("conciliacion");
			expect(getPreviousPhase("declaracion")).toBe("cierre");
			expect(getPreviousPhase("auditoria")).toBe("declaracion");
		});

		it("returns undefined for the first phase", () => {
			expect(getPreviousPhase("captura")).toBeUndefined();
		});
	});

	describe("createDefaultPhaseGraph", () => {
		const graph = createDefaultPhaseGraph();

		it("creates a graph with 6 phases", () => {
			expect(graph.phases).toHaveLength(6);
			expect(graph.phases.map((p) => p.id)).toEqual(PHASE_ORDER);
		});

		it("creates a graph with 5 transitions", () => {
			expect(graph.transitions).toHaveLength(5);
		});

		it("has correct transition pairs", () => {
			const pairs = graph.transitions.map((t) => `${t.from}→${t.to}`);
			expect(pairs).toEqual([
				"captura→clasificacion",
				"clasificacion→conciliacion",
				"conciliacion→cierre",
				"cierre→declaracion",
				"declaracion→auditoria",
			]);
		});

		it("has entry gates on all phases except auditoria", () => {
			for (const phase of graph.phases) {
				if (phase.id === "auditoria") {
					expect(phase.entryGates).toEqual(["declaracion-done"]);
				} else {
					expect(phase.entryGates.length).toBeGreaterThanOrEqual(1);
				}
			}
		});

		it("has exit gates on all phases except auditoria", () => {
			for (const phase of graph.phases) {
				if (phase.id === "auditoria") {
					expect(phase.exitGates).toEqual([]);
				} else {
					expect(phase.exitGates.length).toBeGreaterThanOrEqual(1);
				}
			}
		});

		it("all transitions are non-auto by default", () => {
			for (const t of graph.transitions) {
				expect(t.autoTransition).toBe(false);
			}
		});
	});

	describe("validateGraph", () => {
		it("returns no errors for the default graph", () => {
			const graph = createDefaultPhaseGraph();
			const errors = validateGraph(graph);
			expect(errors).toEqual([]);
		});

		it("detects duplicate phase IDs", () => {
			const graph = createDefaultPhaseGraph();
			graph.phases.push({ ...graph.phases[0] });
			const errors = validateGraph(graph);
			expect(errors).toContain("Duplicate phase IDs detected");
		});

		it("detects transitions to unknown phases", () => {
			const graph = createDefaultPhaseGraph();
			graph.transitions.push({
				from: "captura",
				to: "nonexistent" as never,
				condition: { type: "auto_pass" },
				autoTransition: false,
			});
			const errors = validateGraph(graph);
			expect(errors.some((e) => e.includes("nonexistent"))).toBe(true);
		});
	});
});
