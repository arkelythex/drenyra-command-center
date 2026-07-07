import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const GUARDRAIL = resolve(ROOT, "scripts/ci/check-forbidden-terms.ts");

function runGuardrail(args: string[], cwd: string = ROOT): number {
	const result = spawnSync("bun", [GUARDRAIL, ...args], {
		cwd,
		stdio: "pipe",
	});
	return result.status ?? 1;
}

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

	it("exception file suppresses known violations", () => {
		const result = runGuardrail([
			"--exceptions-file",
			resolve(ROOT, "scripts/ci/forbidden-terms-exceptions.json"),
		]);
		expect(result).toBe(0);
	});

	it("bare-term exception (no line) suppresses violations across all lines", () => {
		const dir = mkdtempSync(resolve(tmpdir(), "forbidden-terms-test-"));
		try {
			const fixtureRel = "apps/web/src/__forbidden_test__/test.tsx";
			const fixtureDir = resolve(dir, "apps/web/src/__forbidden_test__");
			mkdirSync(fixtureDir, { recursive: true });
			const fixtureFile = resolve(fixtureDir, "test.tsx");
			writeFileSync(fixtureFile, 'const x = "swarm";\nconst y = "swarm";\n');

			const exceptionsPath = resolve(dir, "exceptions.json");
			writeFileSync(
				exceptionsPath,
				JSON.stringify({
					[fixtureRel]: [{ term: "swarm", reason: "bare term test" }],
				}),
			);

			const result = runGuardrail(["--exceptions-file", exceptionsPath], dir);
			expect(result).toBe(0);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("bare-term exception does not suppress violations for other terms", () => {
		const dir = mkdtempSync(resolve(tmpdir(), "forbidden-terms-test-"));
		try {
			const fixtureRel = "apps/web/src/__forbidden_test__/test.tsx";
			const fixtureDir = resolve(dir, "apps/web/src/__forbidden_test__");
			mkdirSync(fixtureDir, { recursive: true });
			const fixtureFile = resolve(fixtureDir, "test.tsx");
			writeFileSync(fixtureFile, 'const x = "swarm";\nconst y = "Swarm";\n');

			const exceptionsPath = resolve(dir, "exceptions.json");
			writeFileSync(
				exceptionsPath,
				JSON.stringify({
					[fixtureRel]: [{ term: "swarm", reason: "bare term test" }],
				}),
			);

			const result = runGuardrail(["--exceptions-file", exceptionsPath], dir);
			expect(result).toBe(1);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("script exits non-zero with unknown violations", () => {
		const result = runGuardrail([]);
		expect(result).toBe(1);
	});
});
