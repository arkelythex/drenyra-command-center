/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import {
	countLines,
	DEFAULT_MAX_LINES,
	isSourceFile,
	parseArguments,
} from "./check-max-lines";

describe("parseArguments", () => {
	test("uses the conservative default when no override is provided", () => {
		expect(parseArguments([])).toEqual({
			maxLines: DEFAULT_MAX_LINES,
			help: false,
		});
	});

	test("accepts separated and inline max overrides", () => {
		expect(parseArguments(["--max", "250"]).maxLines).toBe(250n);
		expect(parseArguments(["--max=500"]).maxLines).toBe(500n);
	});

	test("rejects missing, non-positive, and unknown arguments", () => {
		expect(() => parseArguments(["--max"])).toThrow("positive integer");
		expect(() => parseArguments(["--max", "0"])).toThrow("invalid --max");
		expect(() => parseArguments(["--other"])).toThrow("unknown argument");
	});
});

describe("source classification", () => {
	test("includes source files across repository packages", () => {
		expect(isSourceFile("apps/api/src/server.ts")).toBe(true);
		expect(isSourceFile("services/worker/main.go")).toBe(true);
		expect(isSourceFile("scripts/check.sh")).toBe(true);
	});

	test("excludes generated, dependency, artifact, migration, lock, and minified files", () => {
		const excludedPaths = [
			"node_modules/pkg/index.ts",
			".incident/review-lock/runtime-provenance/extensions-gentle-ai.mjs",
			"archived/apps-cli/dist-bundle/index.js",
			"apps/data-engine/.venv/lib/site-packages/vendor.py",
			"apps/web/dist/bundle.js",
			"coverage/report.js",
			"packages/db/migrations/0033_snapshot.sql",
			"src/client.generated.ts",
			"public/app.min.js",
			"bun.lock",
			"archive.tar.gz",
		];
		for (const filePath of excludedPaths) {
			expect(isSourceFile(filePath)).toBe(false);
		}
	});
});

describe("countLines", () => {
	test("counts empty, terminated, and unterminated text consistently", () => {
		expect(countLines("")).toBe(0n);
		expect(countLines("first\nsecond\n")).toBe(2n);
		expect(countLines("first\nsecond")).toBe(2n);
	});
});
