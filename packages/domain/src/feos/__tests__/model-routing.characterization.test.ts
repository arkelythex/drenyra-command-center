import { describe, expect, it } from "vitest";
import { DRENYRA_MODEL_REGISTRY, ModelRouter } from "../model-routing";

const RISKS = ["R0", "R1", "R2", "R3"] as const;
const CAPS: Array<string[] | undefined> = [
	undefined,
	[],
	["extraction"],
	["validation", "analysis"],
	["ocr", "normative_reasoning"],
	["does_not_exist"],
	["judgment_day"],
];

function attempt(
	router: ModelRouter,
	riskLevel: (typeof RISKS)[number],
	requiredCapabilities?: string[],
) {
	try {
		return router.route({ riskLevel, taskType: "t", requiredCapabilities });
	} catch (e) {
		return {
			error:
				(e as { code?: string; message: string }).code ?? (e as Error).message,
		};
	}
}

describe("ModelRouter.route (characterization)", () => {
	it("pins the decision for every risk level x required capabilities on the default registry", () => {
		const router = new ModelRouter();
		const out = Object.fromEntries(
			RISKS.flatMap((r) =>
				CAPS.map(
					(c) =>
						[`${r} | ${JSON.stringify(c)}`, attempt(router, r, c)] as const,
				),
			),
		);
		expect(out).toMatchSnapshot();
	});

	it("skips unavailable models", () => {
		const entries = DRENYRA_MODEL_REGISTRY.map((m, i) => ({
			...m,
			available: i % 2 === 0,
		}));
		const router = new ModelRouter(entries);
		const out = Object.fromEntries(RISKS.map((r) => [r, attempt(router, r)]));
		expect(out).toMatchSnapshot();
	});

	it("fails with NO_SUITABLE_MODEL when nothing is available", () => {
		const router = new ModelRouter(
			DRENYRA_MODEL_REGISTRY.map((m) => ({ ...m, available: false })),
		);
		expect(attempt(router, "R0")).toEqual({ error: "NO_SUITABLE_MODEL" });
	});

	it("fails with NO_SUITABLE_MODEL when R3 needs tool calling and no model has it", () => {
		const entries = DRENYRA_MODEL_REGISTRY.map((m) => ({
			...m,
			capabilities: { ...m.capabilities, supportsToolCalling: false },
		}));
		expect(attempt(new ModelRouter(entries), "R3")).toEqual({
			error: "NO_SUITABLE_MODEL",
		});
	});

	it("fails when R2 needs constrained output and no model has it", () => {
		const entries = DRENYRA_MODEL_REGISTRY.map((m) => ({
			...m,
			capabilities: { ...m.capabilities, supportsConstrainedOutput: false },
		}));
		expect(attempt(new ModelRouter(entries), "R2")).toEqual({
			error: "NO_SUITABLE_MODEL",
		});
		expect(attempt(new ModelRouter(entries), "R1")).not.toEqual({
			error: "NO_SUITABLE_MODEL",
		});
	});
});
