import { describe, expect, it } from "bun:test";
import type { ProviderResponse } from "../provider-adapter.types";
import {
	CostCapEnforcer,
	ReputationGate,
	ResponseValidator,
	runQualityGates,
} from "../quality-gates";

function makeResponse(
	overrides: Partial<ProviderResponse> = {},
): ProviderResponse {
	return {
		content: "test response",
		modelName: "gpt-4o",
		latencyMs: 1000,
		inputTokens: 100,
		outputTokens: 50,
		costCents: 2,
		...overrides,
	};
}

describe("ResponseValidator", () => {
	const gate = new ResponseValidator();

	it("passes when response has valid content and latency", () => {
		const result = gate.check(makeResponse());
		expect(result.passed).toBe(true);
		expect(result.score).toBe(1);
	});

	it("fails when content is empty", () => {
		const result = gate.check(makeResponse({ content: "" }));
		expect(result.passed).toBe(false);
		expect(result.score).toBe(0);
		expect(result.reason).toContain("Empty");
	});

	it("fails when latency exceeds 60s timeout", () => {
		const result = gate.check(makeResponse({ latencyMs: 61_000 }));
		expect(result.passed).toBe(false);
		expect(result.score).toBe(0);
		expect(result.reason).toContain("60s");
	});

	it("passes when latency is exactly 60s", () => {
		const result = gate.check(makeResponse({ latencyMs: 60_000 }));
		expect(result.passed).toBe(true);
	});
});

describe("CostCapEnforcer", () => {
	it("passes when cost is under cap", () => {
		const gate = new CostCapEnforcer(10);
		const result = gate.check(makeResponse({ costCents: 5 }));
		expect(result.passed).toBe(true);
		expect(result.score).toBe(1);
	});

	it("passes when cost equals cap", () => {
		const gate = new CostCapEnforcer(5);
		const result = gate.check(makeResponse({ costCents: 5 }));
		expect(result.passed).toBe(true);
		expect(result.score).toBe(1);
	});

	it("fails when cost exceeds cap", () => {
		const gate = new CostCapEnforcer(10);
		const result = gate.check(makeResponse({ costCents: 15 }));
		expect(result.passed).toBe(false);
		expect(result.score).toBe(0);
		expect(result.reason).toContain("exceeds cap");
	});

	it("score approaches 0 as cost far exceeds cap", () => {
		const gate = new CostCapEnforcer(10);
		const result = gate.check(makeResponse({ costCents: 1000 }));
		expect(result.score).toBeCloseTo(0);
	});
});

describe("ReputationGate", () => {
	it("passes when reliability meets threshold (default 0.7)", () => {
		const gate = new ReputationGate();
		const result = gate.check(makeResponse({ costCents: 1 }));
		expect(result.passed).toBe(true);
		expect(result.score).toBeGreaterThanOrEqual(0.7);
	});

	it("passes with custom threshold", () => {
		const gate = new ReputationGate(0.5);
		const result = gate.check(makeResponse({ costCents: 1 }));
		expect(result.passed).toBe(true);
	});

	it("passes with zero cost (perfection)", () => {
		const gate = new ReputationGate(0.9);
		const result = gate.check(makeResponse({ costCents: 0 }));
		expect(result.passed).toBe(true);
		expect(result.score).toBe(1);
	});
});

describe("runQualityGates", () => {
	it("passes when all gates pass", async () => {
		const gates = [new ResponseValidator(), new CostCapEnforcer(10)];
		const response = makeResponse({ costCents: 2, latencyMs: 500 });

		const { passed, results } = await runQualityGates(gates, response);

		expect(passed).toBe(true);
		expect(results).toHaveLength(2);
		expect(results.every((r) => r.passed)).toBe(true);
	});

	it("fails when any gate fails", async () => {
		const gates = [new ResponseValidator(), new CostCapEnforcer(1)];
		const response = makeResponse({ costCents: 10 });

		const { passed, results } = await runQualityGates(gates, response);

		expect(passed).toBe(false);
		expect(results[0].passed).toBe(true);
		expect(results[1].passed).toBe(false);
	});

	it("passes with no gates", async () => {
		const { passed, results } = await runQualityGates([], makeResponse());
		expect(passed).toBe(true);
		expect(results).toEqual([]);
	});
});
