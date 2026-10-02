import { beforeEach, describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import { TaskDecomposer } from "../task-decomposer";

const mockContext: AgentContext = {
	tenantId: "tenant-1",
	userId: "user-1",
	organizationId: "org-1",
	companyId: "comp-1",
	ruc: "20123456789",
	sessionId: "session-1",
	traceId: "trace-1",
};

describe("TaskDecomposer", () => {
	let decomposer: TaskDecomposer;

	beforeEach(() => {
		decomposer = new TaskDecomposer();
	});

	it("should always include extract + validate steps", () => {
		const result = decomposer.decompose("list products", mockContext, [
			"scripta",
			"regula",
		]);

		expect(result.steps.length).toBeGreaterThanOrEqual(2);
		expect(result.steps[0].domain).toBe("scripta");
		expect(result.steps[0].tools).toContain("extract");
		expect(result.steps[1].domain).toBe("regula");
		expect(result.steps[1].tools).toContain("validate");
	});

	it("should not add classify step for data-only goals", () => {
		const result = decomposer.decompose("extract data", mockContext, [
			"scripta",
		]);

		const classifyStep = result.steps.find((s) => s.tools.includes("classify"));
		expect(classifyStep).toBeUndefined();
	});

	it("should add classify step for non-data-only goals", () => {
		const result = decomposer.decompose("analyze revenue", mockContext, [
			"cerno",
			"lumen",
		]);

		const classifyStep = result.steps.find((s) => s.tools.includes("classify"));
		expect(classifyStep).toBeDefined();
		expect(classifyStep!.domain).toBe("cerno");
	});

	it("should add compliance step for fiscal/regulatory goals", () => {
		const result = decomposer.decompose(
			"check IGV compliance for March",
			mockContext,
			["scripta", "regula", "cerno"],
		);

		const complyStep = result.steps.find((s) => s.tools.includes("comply"));
		expect(complyStep).toBeDefined();
		expect(complyStep!.domain).toBe("regula");
	});

	it("should add analysis step for analysis goals", () => {
		const result = decomposer.decompose(
			"analyze cashflow trends",
			mockContext,
			["lumen", "scripta"],
		);

		const analyzeStep = result.steps.find((s) => s.tools.includes("analyze"));
		expect(analyzeStep).toBeDefined();
		expect(analyzeStep!.domain).toBe("lumen");
	});

	it("should add consolidation step for complex goals", () => {
		const result = decomposer.decompose("merge financial data", mockContext, [
			"fusio",
			"scripta",
			"regula",
			"cerno",
			"lumen",
		]);

		const consolidateStep = result.steps.find((s) =>
			s.tools.includes("consolidate"),
		);
		expect(consolidateStep).toBeDefined();
		expect(consolidateStep!.domain).toBe("fusio");
	});

	it("should have sequential dependencies between steps", () => {
		const result = decomposer.decompose("analyze IGV compliance", mockContext, [
			"scripta",
			"regula",
			"cerno",
			"lumen",
		]);

		for (const step of result.steps) {
			if (step.dependencies.length > 0) {
				for (const depId of step.dependencies) {
					const depExists = result.steps.find((s) => s.id === depId);
					expect(depExists).toBeDefined();
				}
			}
		}
	});

	it("should produce parallel groups", () => {
		const result = decomposer.decompose("full fiscal analysis", mockContext, [
			"scripta",
			"regula",
			"cerno",
			"lumen",
			"fusio",
		]);

		expect(result.parallelGroups.length).toBeGreaterThan(0);
		for (const group of result.parallelGroups) {
			expect(group.length).toBeGreaterThan(0);
			for (const stepId of group) {
				const stepExists = result.steps.find((s) => s.id === stepId);
				expect(stepExists).toBeDefined();
			}
		}
	});

	it("should include root step in parallel groups", () => {
		const result = decomposer.decompose("full fiscal analysis", mockContext, [
			"scripta",
			"regula",
			"cerno",
			"lumen",
			"fusio",
		]);

		// Root step (no dependencies) gets its own parallel group
		expect(result.parallelGroups.length).toBeGreaterThanOrEqual(1);
		expect(result.parallelGroups[0]).toContain("step-1");
	});

	it("should preserve goal in result", () => {
		const result = decomposer.decompose("test goal", mockContext, []);
		expect(result.goal).toBe("test goal");
	});

	it("should handle empty available domains", () => {
		const result = decomposer.decompose("do something", mockContext, []);

		// Should still produce basic extract + validate steps
		expect(result.steps.length).toBeGreaterThanOrEqual(2);
	});

	describe("parallel groups schedule the whole plan", () => {
		const goals = [
			"extract invoices",
			"procesar factura",
			"igv report compare",
			"full fiscal analysis",
			"merge consolidate sunat",
		];
		const domains = ["scripta", "regula", "cerno", "lumen", "fusio"];

		it.each(goals)(
			"every step appears exactly once, after its dependencies: %s",
			(goal) => {
				const { steps, parallelGroups } = decomposer.decompose(
					goal,
					mockContext,
					domains,
				);
				const flat = parallelGroups.flat();
				expect([...flat].sort()).toEqual(steps.map((s) => s.id).sort());

				const seen = new Set<string>();
				for (const group of parallelGroups) {
					for (const id of group) {
						const step = steps.find((s) => s.id === id);
						for (const dep of step?.dependencies ?? []) {
							expect(seen.has(dep)).toBe(true);
						}
					}
					for (const id of group) seen.add(id);
				}
			},
		);

		it("runs a linear extract -> validate chain as two sequential groups", () => {
			const { parallelGroups } = decomposer.decompose(
				"extract invoices",
				mockContext,
				domains,
			);
			expect(parallelGroups).toEqual([["step-1"], ["step-2"]]);
		});
	});
});
