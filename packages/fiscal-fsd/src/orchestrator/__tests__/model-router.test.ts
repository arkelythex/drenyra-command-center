import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL_ASSIGNMENTS, ModelRouter } from "../model-router";

describe("ModelRouter", () => {
	it("resolves default assignments for all 6 phases", async () => {
		const router = new ModelRouter();

		const fases = [
			"solicitud",
			"analisis",
			"diseno",
			"plan",
			"migracion",
			"auditoria",
		] as const;

		for (const fase of fases) {
			const caller = await router.resolve(fase);
			expect(caller).toBeDefined();
			expect(typeof caller).toBe("function");
		}
	});

	it("uses custom assignments over defaults", async () => {
		const customCaller = async () => "custom response";
		const router = new ModelRouter(DEFAULT_MODEL_ASSIGNMENTS, customCaller);

		const caller = await router.resolve("solicitud");
		expect(caller).toBeDefined();
	});

	it("returns default caller when no provider is available", async () => {
		const defaultCaller = async (_s: string, _p: string) => "fallback";
		const router = new ModelRouter([], defaultCaller);

		const caller = await router.resolve("solicitud");
		const result = await caller("system", "prompt");
		expect(result).toBe("fallback");
	});

	it("returns assignments filtered and sorted by fase", () => {
		const router = new ModelRouter();
		const assignments = router.getAssignmentsForFase("solicitud");

		expect(assignments.length).toBeGreaterThanOrEqual(1);
		expect(assignments.every((a) => a.fase === "solicitud")).toBe(true);
		// Sorted by priority ascending
		for (let i = 1; i < assignments.length; i++) {
			expect(assignments[i].priority).toBeGreaterThanOrEqual(
				assignments[i - 1].priority,
			);
		}
	});

	it("updateAssignments replaces existing assignments", () => {
		const router = new ModelRouter();
		router.updateAssignments([
			{
				fase: "solicitud",
				provider: "custom",
				model: "custom-model",
				priority: 0,
				reason: "Custom provider",
			},
		]);

		const assignments = router.getAssignmentsForFase("solicitud");
		expect(assignments).toHaveLength(1);
		expect(assignments[0].provider).toBe("custom");
	});

	it("registerProvider adds a custom provider resolver", () => {
		const router = new ModelRouter();
		router.registerProvider("custom", (_model: string) => {
			return async (_s: string, _p: string) => "custom response";
		});

		router.updateAssignments([
			{
				fase: "solicitud",
				provider: "custom",
				model: "custom-model",
				priority: 0,
				reason: "Custom provider",
			},
		]);

		const assignments = router.getAssignmentsForFase("solicitud");
		expect(assignments[0].provider).toBe("custom");
	});

	it("default caller throws when no fallback configured", async () => {
		const router = new ModelRouter([]);

		const caller = await router.resolve("solicitud");
		await expect(caller("system", "prompt")).rejects.toThrow(
			"No hay LLM caller disponible",
		);
	});

	it("DEFAULT_MODEL_ASSIGNMENTS covers all 6 phases", () => {
		const phases = new Set(DEFAULT_MODEL_ASSIGNMENTS.map((a) => a.fase));
		expect(phases.has("solicitud")).toBe(true);
		expect(phases.has("analisis")).toBe(true);
		expect(phases.has("diseno")).toBe(true);
		expect(phases.has("plan")).toBe(true);
		expect(phases.has("migracion")).toBe(true);
		expect(phases.has("auditoria")).toBe(true);
	});
});
