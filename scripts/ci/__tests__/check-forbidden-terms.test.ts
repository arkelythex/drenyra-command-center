import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("forbidden-terms guardrail", () => {
	it("exceptions file exists and is valid JSON", () => {
		const content = readFileSync(
			resolve(__dirname, "../forbidden-terms-exceptions.json"),
			"utf-8",
		);
		const parsed = JSON.parse(content);
		expect(parsed).toBeInstanceOf(Object);
		for (const [filePath, exceptions] of Object.entries(parsed)) {
			expect(typeof filePath).toBe("string");
			expect(Array.isArray(exceptions)).toBe(true);
			for (const exc of exceptions as Array<{
				term: string;
				line?: number;
				reason: string;
			}>) {
				expect(typeof exc.term).toBe("string");
				expect(typeof exc.reason).toBe("string");
			}
		}
	});

	it("exception file suppresses known violations", async () => {
		const result = await Bun.spawn(
			[
				"bun",
				"scripts/ci/check-forbidden-terms.ts",
				"--exceptions-file",
				"scripts/ci/forbidden-terms-exceptions.json",
			],
			{
				cwd: resolve(__dirname, "../../.."),
			},
		).exited;

		expect(result).toBe(0);
	});

	it("script exits non-zero with unknown violations", async () => {
		const result = await Bun.spawn(
			["bun", "scripts/ci/check-forbidden-terms.ts"],
			{
				cwd: resolve(__dirname, "../../.."),
			},
		).exited;

		expect(result).toBe(1);
	});
});
