import { describe, expect, it } from "vitest";

import { classifyProcessResult } from "../quality-baseline";

describe("classifyProcessResult", () => {
	it("classifies a successful command and an ordinary findings exit", () => {
		expect(
			classifyProcessResult({ exitCode: 0, output: "ok" }).classification,
		).toBe("pass");
		expect(
			classifyProcessResult({
				exitCode: 1,
				output: "src/example.ts:1: error TS1005: expected token",
			}),
		).toMatchObject({ classification: "findings", observedFailure: null });
	});

	it("classifies a missing command entry point without inferring its cause", () => {
		expect(
			classifyProcessResult({
				exitCode: 127,
				output:
					"/usr/bin/bash: ./scripts/dev/quality-core.sh: No such file or directory",
			}),
		).toEqual({
			classification: "missing-entry-point",
			observedFailure: "command entry point is missing",
		});
	});

	it("classifies a tool crash as a tool failure", () => {
		expect(
			classifyProcessResult({
				exitCode: 1,
				output:
					"TypeError: Cannot read properties of undefined (reading 'Cjs')",
			}),
		).toEqual({
			classification: "tool-failure",
			observedFailure: "tool crashed before producing findings",
		});
	});

	it("classifies a configuration error as a tool failure", () => {
		expect(
			classifyProcessResult({
				exitCode: 1,
				output: "Biome exited because the configuration resulted in errors.",
			}),
		).toEqual({
			classification: "tool-failure",
			observedFailure: "tool configuration prevented a reliable result",
		});
	});
});
