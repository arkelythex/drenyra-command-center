/**
 * Characterization tests for the LLM-backed FSD phases (frozen before refactoring
 * createLLMPhase). They pin the prompt assembly, the failure path and the JSON parsing.
 */

import { describe, expect, it } from "vitest";
import type { PhaseContext, PhaseResult } from "../../types";
import {
	createAnalisisPhase,
	createAuditoriaPhase,
	createSolicitudPhase,
} from "../fsd-phases";

type Call = { system: string; user: string };

function recorder(reply: string | Error | unknown) {
	const calls: Call[] = [];
	const caller = async (system: string, user: string) => {
		calls.push({ system, user });
		if (reply instanceof Error) throw reply;
		if (typeof reply !== "string") throw reply;
		return reply;
	};
	return { calls, caller };
}

function ctx(overrides: Partial<PhaseContext> = {}): PhaseContext {
	return {
		runId: "run-1",
		previousPhaseResults: new Map(),
		metadata: {},
		...overrides,
	} as PhaseContext;
}

describe("createLLMPhase (via createSolicitudPhase)", () => {
	it("builds the context block only from the metadata that is present", async () => {
		const { calls, caller } = recorder("{}");
		await createSolicitudPhase(caller).execute(
			{},
			ctx({
				metadata: { title: "T", regulationRef: "RS 123", description: "D" },
				scope: {
					organizationId: "org-1",
					companyId: "c",
					companyRuc: "20123456789",
					period: "2026-07",
				},
			}),
		);
		const user = calls[0]?.user ?? "";
		expect(user).toContain(
			[
				"Título: T",
				"Normativa: RS 123",
				"Descripción: D",
				"Run ID: run-1",
				"Alcance: org-1/20123456789",
			].join("\n"),
		);
	});

	it("omits empty metadata and scope lines", async () => {
		const { calls, caller } = recorder("{}");
		await createSolicitudPhase(caller).execute({}, ctx());
		const user = calls[0]?.user ?? "";
		expect(user).toContain("Run ID: run-1");
		expect(user).not.toContain("Título:");
		expect(user).not.toContain("Normativa:");
		expect(user).not.toContain("Alcance:");
	});

	it("uses the fiscal system prompt", async () => {
		const { calls, caller } = recorder("{}");
		await createSolicitudPhase(caller).execute({}, ctx());
		expect(calls[0]?.system).toBe(
			"Eres un asistente fiscal. Responde solo con JSON válido, sin markdown.",
		);
	});
});

describe("previous output placeholders (via createAuditoriaPhase)", () => {
	it("injects the pretty-printed input and the 'analisis' result", async () => {
		const { calls, caller } = recorder("{}");
		const previous = new Map<string, PhaseResult>([
			["analisis", { marker: "analysis-output" } as unknown as PhaseResult],
		]);
		await createAuditoriaPhase(caller).execute(
			{ step: 1 },
			ctx({ previousPhaseResults: previous }),
		);
		const user = calls[0]?.user ?? "";
		expect(user).toContain(JSON.stringify({ step: 1 }, null, 2));
		expect(user).toContain(
			JSON.stringify({ marker: "analysis-output" }, null, 2),
		);
	});

	it("falls back to {} for a missing input and a missing analysis", async () => {
		const { calls, caller } = recorder("{}");
		await createAuditoriaPhase(caller).execute(undefined, ctx());
		const user = calls[0]?.user ?? "";
		expect(user).not.toContain("{{");
		expect(user.split("{}").length - 1).toBeGreaterThanOrEqual(2);
	});
});

describe("LLM failure and parsing", () => {
	it("returns FAILED with the error message when the LLM call throws", async () => {
		const { caller } = recorder(new Error("quota"));
		const result = await createAnalisisPhase(caller).execute({}, ctx());
		expect(result).toEqual({
			status: "FAILED",
			output: null,
			gatesPassed: [],
			evidenceArtifacts: [],
			errors: ["LLM call failed: quota"],
			confidence: 0,
		});
	});

	it("stringifies a non-Error rejection", async () => {
		const failing = async () => {
			throw "boom";
		};
		const result = await createAnalisisPhase(failing).execute({}, ctx());
		expect(result.errors).toEqual(["LLM call failed: boom"]);
	});

	it("parses plain JSON", async () => {
		const { caller } = recorder('{"a":1}');
		const result = await createAnalisisPhase(caller).execute({}, ctx());
		expect(result.status).toBe("SUCCESS");
		expect(result.output).toEqual({ a: 1 });
		expect(result.confidence).toBe(0.8);
		expect(result.errors).toEqual([]);
	});

	it("strips a ```json fence before parsing", async () => {
		const { caller } = recorder('```json\n{"a":2}\n```');
		const result = await createAnalisisPhase(caller).execute({}, ctx());
		expect(result.output).toEqual({ a: 2 });
	});

	it("strips a bare ``` fence before parsing", async () => {
		const { caller } = recorder('```\n{"a":3}\n```');
		const result = await createAnalisisPhase(caller).execute({}, ctx());
		expect(result.output).toEqual({ a: 3 });
	});

	it("keeps non-JSON text as { raw } and still succeeds", async () => {
		const { caller } = recorder("no json here");
		const result = await createAnalisisPhase(caller).execute({}, ctx());
		expect(result.status).toBe("SUCCESS");
		expect(result.output).toEqual({ raw: "no json here" });
	});
});
