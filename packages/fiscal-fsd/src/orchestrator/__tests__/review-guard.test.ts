import { describe, expect, it } from "vitest";
import { ReviewGuard } from "../review-guard";

describe("ReviewGuard", () => {
	const guard = new ReviewGuard(400);

	it("forecasts low risk for small plans", () => {
		const forecast = guard.forecast({
			gruposTareas: [{ tarea: "Cambiar tasa IGV en engine" }],
			subsistemasAfectados: ["igv"],
		});

		expect(forecast.estimatedLines).toBe(50);
		expect(forecast.budgetRisk).toBe("LOW");
		expect(forecast.estimatedFiles).toBe(1);
	});

	it("forecasts high risk for large plans", () => {
		const forecast = guard.forecast({
			gruposTareas: Array.from({ length: 20 }, (_, i) => ({
				tarea: `Tarea ${i + 1}`,
			})),
			lineasEstimadasTotal: 1200,
			subsistemasAfectados: ["sire", "ple", "detracciones"],
		});

		expect(forecast.estimatedLines).toBe(1200);
		expect(forecast.budgetRisk).toBe("HIGH");
		expect(forecast.chainedPrsRecommended).toBe(true);
	});

	it("detects critical subsystems", () => {
		const forecast = guard.forecast({
			subsistemasAfectados: ["sire", "sunat"],
		});

		expect(forecast.chainedPrsRecommended).toBe(true);
		expect(forecast.affectedSubsystems).toContain("sire");
		expect(forecast.affectedSubsystems).toContain("sunat");
	});

	it("uses explicit line estimates when available", () => {
		const forecast = guard.forecast({
			lineasEstimadasTotal: 250,
			archivosModificados: ["a.ts", "b.ts", "c.ts"],
		});

		expect(forecast.estimatedLines).toBe(250);
		expect(forecast.estimatedFiles).toBe(3);
	});

	it("estimates files from lines when not provided", () => {
		const forecast = guard.forecast({
			lineasEstimadasTotal: 500,
		});

		expect(forecast.estimatedFiles).toBe(10);
	});

	it("decides proceed for low-risk plans", () => {
		const forecast = guard.forecast({ gruposTareas: [{ tarea: "fix" }] });
		const decision = guard.decide(forecast, "ask-on-risk");

		expect(decision.action).toBe("proceed");
	});

	it("decides split for high-risk plans", () => {
		const forecast = guard.forecast({
			gruposTareas: Array.from({ length: 20 }, (_, i) => ({
				tarea: `Tarea ${i + 1}`,
			})),
			lineasEstimadasTotal: 1200,
			subsistemasAfectados: ["sire", "ple", "detracciones"],
		});

		const decision = guard.decide(forecast, "ask-on-risk");
		expect(decision.action).toBe("split");
		expect(decision.splitInto).toBeDefined();
		expect(decision.splitInto?.length).toBeGreaterThanOrEqual(1);
	});

	it("splits by critical subsystems", () => {
		const forecast = guard.forecast({
			gruposTareas: Array.from({ length: 10 }, (_, i) => ({
				tarea: `Tarea ${i + 1}`,
			})),
			subsistemasAfectados: ["detracciones", "sire", "igv"],
		});

		const chunks = guard.splitIntoChunks(forecast);
		expect(chunks).toContain("migracion-detracciones");
		expect(chunks).toContain("migracion-sire");
		expect(chunks).toContain("migracion-igv");
	});

	it("splits by file count when no subsystems", () => {
		const forecast = guard.forecast({
			lineasEstimadasTotal: 1200,
			subsistemasAfectados: [],
		});

		const chunks = guard.splitIntoChunks(forecast);
		expect(chunks.length).toBe(3); // 1200 / 400 = 3
	});

	it("single-pr strategy always proceeds", () => {
		const forecast = guard.forecast({
			lineasEstimadasTotal: 2000,
		});

		const decision = guard.decide(forecast, "single-pr");
		expect(decision.action).toBe("proceed");
	});

	it("auto-chain splits high-risk plans", () => {
		const forecast = guard.forecast({
			lineasEstimadasTotal: 1000,
			subsistemasAfectados: ["detracciones"],
		});

		const decision = guard.decide(forecast, "auto-chain");
		expect(decision.action).toBe("split");
	});

	it("exception-ok always proceeds", () => {
		const forecast = guard.forecast({
			lineasEstimadasTotal: 2000,
		});

		const decision = guard.decide(forecast, "exception-ok");
		expect(decision.action).toBe("proceed");
	});

	it("asks on medium risk", () => {
		const guardWithLowBudget = new ReviewGuard(100);
		const forecast = guardWithLowBudget.forecast({
			lineasEstimadasTotal: 80,
			archivosModificados: Array.from({ length: 20 }, (_, i) => `f${i}.ts`),
		});

		const decision = guardWithLowBudget.decide(forecast, "ask-on-risk");
		expect(decision.action).toBe("ask");
	});
});
